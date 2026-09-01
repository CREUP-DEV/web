import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../../../db'
import { newsletterCampaigns } from '../../../../../db/schema'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { getRequiredSiteUrl } from '../../../../../utils/core/runtimeConfig'
import { buildAbsoluteUrl, normalizeBaseUrl } from '../../../../../utils/core/urlBuilder'
import { logError } from '../../../../../utils/core/logger'
import { enforceRateLimit } from '../../../../../utils/public/rateLimit'
import { sendNewsletterCampaignTestEmail } from '../../../../../utils/email/newsletterCampaignMailer'
import {
  loadCampaignRenderContext,
  NEWSLETTER_UNSUBSCRIBE_PAGE_PATH,
  renderCampaignEmail,
} from '../../../../../utils/email/newsletterCampaignRender'
import {
  idRouteParamSchema,
  validateBody,
  validateRouteParams,
} from '../../../../../utils/validation'
import { newsletterCampaignTestSendSchema } from '~~/shared/utils/adminSchemas'

/**
 * Sends one copy of the campaign to an address the admin types, which is what is needed while the
 * campaign is still a draft.
 *
 * It creates no delivery row and changes no state — not the campaign's, not the click counters:
 * the links go straight to their target and the unsubscribe link lands on the page without a
 * token, because there is no subscription behind a test.
 */

const TEST_SEND_RATE_LIMIT = { maxRequests: 10, windowMs: 15 * 60 * 1000 }
const TEST_SUBJECT_PREFIX = '[PRUEBA] '

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { email, locale } = validateBody(
      event,
      newsletterCampaignTestSendSchema,
      await readBody(event)
    )

    await enforceRateLimit(event, {
      namespace: 'newsletter-campaign-test-send',
      errorMessage: getAdminApiErrorMessage(event, 'campaignTestSendRateLimited'),
      ...TEST_SEND_RATE_LIMIT,
    })

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

    const siteUrl = normalizeBaseUrl(getRequiredSiteUrl(event))
    const context = await loadCampaignRenderContext({
      campaignId: id,
      siteUrl,
      links: 'direct',
      unsubscribeUrl: buildAbsoluteUrl(siteUrl, NEWSLETTER_UNSUBSCRIBE_PAGE_PATH),
      projectLive: campaign.status === 'draft',
    })

    if (!context) {
      throw createError({
        statusCode: 404,
        message: getAdminApiErrorMessage(event, 'campaignNotFound'),
      })
    }

    const rendered = renderCampaignEmail(context, locale)

    try {
      await sendNewsletterCampaignTestEmail({
        to: email,
        rendered: {
          ...rendered,
          subject: `${TEST_SUBJECT_PREFIX}${rendered.subject}`,
        },
        configErrorMessage: getAdminApiErrorMessage(event, 'smtpIncomplete'),
      })
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      logError('admin.newsletterCampaigns.test-send', error, { campaignId: id }, event)

      throw createError({
        statusCode: 502,
        message: getAdminApiErrorMessage(event, 'campaignTestSendFailed'),
      })
    }

    return { data: { sent: true } }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.test-send', error, event)
  }
})
