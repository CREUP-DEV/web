import { defineEventHandler } from 'h3'
import { asc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)

  const [items, countResult] = await Promise.all([
    db.query.mediaOutlets.findMany({
      orderBy: [asc(mediaOutlets.order), asc(mediaOutlets.id)],
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(mediaOutlets),
  ])

  const total = countResult[0]?.count ?? 0

  return {
    data: items,
    meta: { total },
  }
})
