import { createError, defineEventHandler } from 'h3'
import { throwAdminMutationError } from '../../../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../../../utils/locale/adminApiErrorMessages'
import { buildNewsletterCampaignDetail } from '../../../../../utils/newsletter/newsletterCampaigns'
import { cancelNewsletterCampaignSend } from '../../../../../utils/newsletter/newsletterCampaignSend'
import { idRouteParamSchema, validateRouteParams } from '../../../../../utils/validation'

/**
 * Cancels a send in progress. The campaign becomes `paused`, keeping its snapshot and deliveries:
 * there is no "undo send", only resume.
 */
export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    await cancelNewsletterCampaignSend(event, id)

    const campaign = await buildNewsletterCampaignDetail(id)

    if (!campaign) {
      throw createError({
        statusCode: 404,
        message: getAdminApiErrorMessage(event, 'campaignNotFound'),
      })
    }

    return { data: campaign }
  } catch (error) {
    throwAdminMutationError('admin.newsletterCampaigns.cancel', error, event)
  }
})
