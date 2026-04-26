import { defineEventHandler } from 'h3'
import { asc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { adminCollectionQuerySchema, validateQuery } from '../../../utils/validation'
import { logAdminCollectionCapHit } from '../../../utils/admin/adminCollectionLimit'

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, adminCollectionQuerySchema)
  const limit = query.limit ?? 500
  const offset = query.offset ?? 0

  const [items, countResult] = await Promise.all([
    db.query.carouselItems.findMany({
      orderBy: asc(carouselItems.order),
      with: { translations: true },
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(carouselItems),
  ])

  const total = countResult[0]?.count ?? 0
  logAdminCollectionCapHit(event, 'carousel', { limit, offset, total })

  return {
    data: items,
    meta: { total },
  }
})
