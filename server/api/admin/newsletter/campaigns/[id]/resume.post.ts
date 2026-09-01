import { createError, defineEventHandler } from 'h3'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { buildNewsletterCampaignDetail } from '../../../../../utils/newsletter/newsletterCampaigns'
import {
  enqueueNewsletterCampaignSendSafely,
  resumeNewsletterCampaign,
} from '../../../../../utils/newsletter/newsletterCampaignSend'
import { idRouteParamSchema, validateRouteParams } from '../../../../../utils/validation'

/**
 * Resumes a paused campaign, or retries the failed deliveries of one that finished with incidents.
 * Only the pending recipients are sent to, and the frozen snapshot is never recomputed.
 */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const claimed = await resumeNewsletterCampaign(event, id)

    await enqueueNewsletterCampaignSendSafely(id, claimed.lastDeliveryWorkerToken, event)

    const campaign = await buildNewsletterCampaignDetail(id)

    if (!campaign) {
      throw createError({
        statusCode: 404,
        message: getAdminApiErrorMessage(event, 'campaignNotFound'),
      })
    }

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.resume', error, event)
  }
})
