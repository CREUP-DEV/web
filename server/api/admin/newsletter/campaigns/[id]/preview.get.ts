import { createError, defineEventHandler, setHeader } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../db'
import { newsletterCampaigns } from '../../../../../db/schema'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { getRequiredSiteUrl } from '../../../../../utils/core/runtimeConfig'
import { normalizeBaseUrl } from '../../../../../utils/core/urlBuilder'
import {
  loadCampaignRenderContext,
  renderCampaignEmail,
} from '../../../../../utils/email/newsletterCampaignRender'
import {
  idRouteParamSchema,
  validateQuery,
  validateRouteParams,
} from '../../../../../utils/validation'
import { newsletterCampaignPreviewQuerySchema } from '~~/shared/utils/adminSchemas'

/**
 * Renders the campaign exactly as the mailer would — same functions, same snapshot — because a
 * preview built any other way drifts from what subscribers receive and stops being worth looking at.
 *
 * Two substitutions make it safe to open in the admin: the unsubscribe sentinel becomes an inert
 * anchor, and the links go straight to their target instead of through the click counter, so
 * previewing an email never moves a metric.
 */

const INERT_UNSUBSCRIBE_URL = '#'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const { locale } = validateQuery(event, newsletterCampaignPreviewQuerySchema)

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

  const context = await loadCampaignRenderContext({
    campaignId: id,
    siteUrl: normalizeBaseUrl(getRequiredSiteUrl(event)),
    links: 'direct',
    unsubscribeUrl: INERT_UNSUBSCRIBE_URL,
    // Drafts have no snapshot yet, so the content is projected live. Anything past `draft` renders
    // what was frozen, which is what was actually sent.
    projectLive: campaign.status === 'draft',
  })

  if (!context) {
    throw createError({
      statusCode: 404,
      message: getAdminApiErrorMessage(event, 'campaignNotFound'),
    })
  }

  setHeader(event, 'content-type', 'text/html; charset=utf-8')
  setHeader(event, 'cache-control', 'no-store')

  return renderCampaignEmail(context, locale).html
})
