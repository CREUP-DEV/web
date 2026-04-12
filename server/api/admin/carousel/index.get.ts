import { defineEventHandler } from 'h3'
import { asc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'

const DEFAULT_LIMIT = 50

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, paginationQuerySchema)
  const limit = query.limit ?? DEFAULT_LIMIT
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

  return {
    data: items,
    meta: { total },
    items,
    total,
  }
})
