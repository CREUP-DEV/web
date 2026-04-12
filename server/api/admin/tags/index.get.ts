import { defineEventHandler } from 'h3'
import { asc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { adminCollectionQuerySchema, validateQuery } from '../../../utils/validation'
import { logAdminCollectionCapHit } from '../../../utils/adminCollectionLimit'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, adminCollectionQuerySchema)

  const [items, countResult] = await Promise.all([
    db.query.tags.findMany({
      orderBy: [asc(tags.order), asc(tags.id)],
      with: { translations: true },
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(tags),
  ])

  const total = countResult[0]?.count ?? 0
  logAdminCollectionCapHit(event, 'tags', { limit, offset, total })

  return {
    data: items,
    meta: { total },
  }
})
