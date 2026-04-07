import { defineEventHandler } from 'h3'
import { desc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { paginationQuerySchema, validateQuery } from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, paginationQuerySchema)

  const [items, countResult] = await Promise.all([
    db.query.financialReports.findMany({
      orderBy: desc(financialReports.approvedAt),
      with: { translations: true },
      limit,
      offset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(financialReports),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      approvedAt: dateValueToDateOnly(item.approvedAt),
    })),
    total: countResult[0]?.count ?? 0,
  }
})
