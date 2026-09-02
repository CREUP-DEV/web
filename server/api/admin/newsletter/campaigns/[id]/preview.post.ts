import { createError, defineEventHandler, readBody, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../db'
import { newsletterCampaigns } from '../../../../../db/schema'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { getRequiredSiteUrl } from '../../../../../utils/core/runtimeConfig'
import { normalizeBaseUrl } from '../../../../../utils/core/urlBuilder'
import {
  buildCampaignRenderContext,
  renderCampaignEmail,
} from '../../../../../utils/email/newsletterCampaignRender'
import { projectCampaignItems } from '../../../../../utils/newsletter/campaignSnapshot'
import { sanitizeNewsletterIntroHtml } from '../../../../../utils/press/pressTranslation'
import {
  idRouteParamSchema,
  validateBody,
  validateRouteParams,
} from '../../../../../utils/validation'
import { newsletterCampaignPreviewBodySchema } from '~~/shared/utils/adminSchemas'
import type { NewsletterCampaignItemType } from '~~/shared/constants/newsletterCampaigns'

/**
 * Renders a draft that has not been saved, so the editor can show the email as it is written
 * rather than as it was last stored.
 *
 * Nothing is written. The campaign row is read only to confirm it exists and is still a draft;
 * everything rendered comes from the request body. The send stays blocked while there are unsaved
 * changes, so a live preview cannot become a campaign nobody looked at.
 */

const INERT_UNSUBSCRIBE_URL = '#'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = validateBody(event, newsletterCampaignPreviewBodySchema, await readBody(event))

  const campaign = await db.query.newsletterCampaigns.findFirst({
    where: eq(newsletterCampaigns.id, id),
    columns: { id: true, status: true },
  })

  if (!campaign) {
    throw createError({
      statusCode: 404,
      message: getAdminApiErrorMessage(event, 'campaignNotFound'),
    })
  }

  if (campaign.status !== 'draft') {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'campaignNotDraft'),
    })
  }

  // The item ids are the editor's own, and no row exists for an item that has not been saved yet.
  // Only their position in this array matters for rendering, so index keys are enough.
  const projection = body.items.length
    ? await db.transaction(async (tx) =>
        projectCampaignItems(
          tx,
          body.items.map((item, index) => ({
            id: String(index),
            itemType: item.itemType,
            itemId: item.itemId,
            overrides: item.translations.map((translation) => ({
              locale: translation.locale,
              titleOverride: translation.titleOverride ?? null,
              excerptOverride: translation.excerptOverride ?? null,
            })),
          }))
        )
      )
    : null

  const context = buildCampaignRenderContext({
    campaignId: campaign.id,
    siteUrl: normalizeBaseUrl(getRequiredSiteUrl(event)),
    links: 'direct',
    unsubscribeUrl: INERT_UNSUBSCRIBE_URL,
    translations: body.translations.map((translation) => ({
      locale: translation.locale,
      subject: translation.subject,
      preheader: translation.preheader ?? null,
      // Same allowlist the save applies, so the preview cannot show markup the stored version
      // would strip.
      introHtml: sanitizeNewsletterIntroHtml(translation.introHtml),
    })),
    items: body.items.map((item, index) => ({
      id: String(index),
      itemType: item.itemType as NewsletterCampaignItemType,
      snapshot: projection?.snapshots.get(String(index)) ?? null,
    })),
  })

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')

  return renderCampaignEmail(context, body.locale).html
})
