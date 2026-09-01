import { defineEventHandler, createError } from 'h3'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import {
  getCampaignDeliveryStats,
  loadNewsletterCampaign,
} from '../../../../utils/newsletter/newsletterCampaigns'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const campaign = await loadNewsletterCampaign(id)

  if (!campaign) {
    throw createError({
      statusCode: 404,
      message: getAdminApiErrorMessage(event, 'campaignNotFound'),
    })
  }

  const delivery = await getCampaignDeliveryStats(id)

  return {
    data: {
      ...campaign,
      isSending: Boolean(campaign.lastDeliveryWorkerToken),
      stats: {
        itemCount: campaign.items.length,
        totalClicks: campaign.items.reduce((total, item) => total + item.clickCount, 0),
        unsubscribeCount: campaign.unsubscribeCount,
        delivery,
      },
    },
  }
})
