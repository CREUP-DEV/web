import { defineEventHandler } from 'h3'
import { asc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)

  const [items, countResult] = await Promise.all([
    db.query.equalityDocuments.findMany({
      orderBy: asc(equalityDocuments.order),
      with: { translations: true },
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(equalityDocuments),
  ])

  return { items, total: countResult[0]?.count ?? 0 }
})
