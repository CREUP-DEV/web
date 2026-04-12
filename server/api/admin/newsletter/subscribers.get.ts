import { defineEventHandler } from 'h3'
import { desc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletterSubscribers } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)
  const normalizedLimit = limit ?? 20
  const normalizedOffset = offset ?? 0

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: newsletterSubscribers.id,
        email: newsletterSubscribers.email,
        active: newsletterSubscribers.active,
        subscribedAt: newsletterSubscribers.subscribedAt,
        unsubscribedAt: newsletterSubscribers.unsubscribedAt,
      })
      .from(newsletterSubscribers)
      .orderBy(desc(newsletterSubscribers.subscribedAt), desc(newsletterSubscribers.id))
      .limit(normalizedLimit)
      .offset(normalizedOffset),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(newsletterSubscribers),
  ])

  const total = countResult[0]?.count ?? 0

  return {
    data: items,
    meta: { total },
    items,
    total,
  }
})
