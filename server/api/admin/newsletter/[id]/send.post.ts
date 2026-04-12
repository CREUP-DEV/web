import { defineEventHandler } from 'h3'
import { enqueueNewsletterSendJob } from '../../../../utils/backgroundJobs'
import { monthKeyToDate } from '../../../../utils/newsletters'
import { claimNewsletterForSending } from '../../../../services/newsletterDeliveryService'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const item = await claimNewsletterForSending(id)

  await enqueueNewsletterSendJob({
    newsletterId: item.id,
    workerToken: item.lastDeliveryWorkerToken ?? '',
  })

  const normalizedItem = {
    ...item,
    month: monthKeyToDate(item.monthKey),
  }

  return {
    data: {
      item: normalizedItem,
      queued: true,
    },
  }
})
