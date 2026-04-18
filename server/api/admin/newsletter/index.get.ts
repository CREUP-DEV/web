import { defineEventHandler } from 'h3'
import { desc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'
import { monthKeyToDate, NEWSLETTER_DELIVERY_MAX_ATTEMPTS } from '../../../utils/newsletters'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)
  const normalizedLimit = limit ?? 20
  const normalizedOffset = offset ?? 0

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: newsletters.id,
        monthKey: newsletters.monthKey,
        month: newsletters.month,
        coverImage: newsletters.coverImage,
        pdfUrl: newsletters.pdfUrl,
        publicVisible: newsletters.publicVisible,
        sentAt: newsletters.sentAt,
        lastDeliverySentCount: newsletters.lastDeliverySentCount,
        lastDeliveryTotal: newsletters.lastDeliveryTotal,
        lastDeliveryErrorCount: newsletters.lastDeliveryErrorCount,
        createdAt: newsletters.createdAt,
        updatedAt: newsletters.updatedAt,
        lastDeliveryWorkerToken: newsletters.lastDeliveryWorkerToken,
      })
      .from(newsletters)
      .orderBy(desc(newsletters.month), desc(newsletters.id))
      .limit(normalizedLimit)
      .offset(normalizedOffset),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(newsletters),
  ])

  const normalizedItems = items.map((item) => ({
    id: item.id,
    monthKey: item.monthKey,
    isSending: Boolean(item.lastDeliveryWorkerToken),
    coverImage: item.coverImage,
    pdfUrl: item.pdfUrl,
    publicVisible: item.publicVisible,
    sentAt: item.sentAt,
    lastDeliverySentCount: item.lastDeliverySentCount,
    lastDeliveryTotal: item.lastDeliveryTotal,
    lastDeliveryErrorCount: item.lastDeliveryErrorCount,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    month: monthKeyToDate(item.monthKey),
  }))
  const total = countResult[0]?.count ?? 0
  const maxDeliveryAttempts = NEWSLETTER_DELIVERY_MAX_ATTEMPTS

  return {
    data: normalizedItems,
    meta: {
      total,
      maxDeliveryAttempts,
    },
  }
})
