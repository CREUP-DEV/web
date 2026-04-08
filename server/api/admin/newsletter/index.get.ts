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
      .select()
      .from(newsletters)
      .orderBy(desc(newsletters.month))
      .limit(normalizedLimit)
      .offset(normalizedOffset),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(newsletters),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      isSending: Boolean(item.lastDeliveryWorkerToken),
      month: monthKeyToDate(item.monthKey),
    })),
    total: countResult[0]?.count ?? 0,
    maxDeliveryAttempts: NEWSLETTER_DELIVERY_MAX_ATTEMPTS,
  }
})
