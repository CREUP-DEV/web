import { createError, defineEventHandler } from 'h3'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { buildNewsletterCampaignDetail } from '../../../../../utils/newsletter/newsletterCampaigns'
import {
  enqueueNewsletterCampaignSendSafely,
  freezeAndQueueNewsletterCampaign,
} from '../../../../../utils/newsletter/newsletterCampaignSend'
import { idRouteParamSchema, validateRouteParams } from '../../../../../utils/validation'

/**
 * Starts a send: validates, freezes the snapshot and claims the lease inside one transaction, then
 * — and only then — enqueues the job.
 *
 * The enqueue is deliberately outside the transaction and its failure is not surfaced as an error:
 * the campaign is already `queued` holding its token, which is the state the recovery sweep picks
 * up. Reverting from here would undo a committed send on a callback that may never run.
 */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const claimed = await freezeAndQueueNewsletterCampaign(event, id)

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
    throwAdminMutationError('admin.newsletterCampaigns.send', error, event)
  }
})
