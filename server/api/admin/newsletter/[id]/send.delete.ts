import { createError, defineEventHandler } from 'h3'
import { and, eq, isNotNull, isNull } from 'drizzle-orm'
import { db } from '../../../../db'
import { newsletters } from '../../../../db/schema'
import { getAdminApiErrorMessage } from '../../../../utils/locale/adminApiErrorMessages'
import { removeNewsletterSendJob } from '../../../../utils/core/backgroundJobs'
import { monthKeyToDate } from '../../../../utils/newsletter/newsletters'
import { idRouteParamSchema, validateRouteParams } from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const item = await db.query.newsletters.findFirst({
    where: eq(newsletters.id, id),
  })

  if (!item) {
    throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
  }

  if (!item.lastDeliveryWorkerToken || item.lastDeliveryFinishedAt) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'newsletterNotSending'),
    })
  }

  const workerToken = item.lastDeliveryWorkerToken

  const now = new Date()

  const [updated] = await db
    .update(newsletters)
    .set({
      lastDeliveryFinishedAt: now,
      lastDeliveryHeartbeatAt: null,
      lastDeliveryWorkerToken: null,
    })
    .where(
      and(
        eq(newsletters.id, id),
        isNotNull(newsletters.lastDeliveryWorkerToken),
        isNull(newsletters.lastDeliveryFinishedAt)
      )
    )
    .returning()

  if (!updated) {
    throw createError({
      statusCode: 409,
      message: getAdminApiErrorMessage(event, 'newsletterNotSending'),
    })
  }

  await removeNewsletterSendJob(id, workerToken)

  const normalizedItem = {
    ...updated,
    isSending: false,
    month: monthKeyToDate(updated.monthKey),
  }

  return {
    data: normalizedItem,
  }
})
