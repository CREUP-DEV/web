import { defineEventHandler } from 'h3'
import { runInBackground } from '../../../../utils/backgroundTask'
import {
  claimNewsletterForSending,
  monthKeyToDate,
  processPendingNewsletterDeliveries,
} from '../../../../utils/newsletters'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const item = await claimNewsletterForSending(id)

  runInBackground(event, 'admin.newsletter.manual-send', processPendingNewsletterDeliveries())

  return {
    item: {
      ...item,
      month: monthKeyToDate(item.monthKey),
    },
    queued: true,
  }
})
