import { defineEventHandler } from 'h3'
import { desc, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { adminCollectionQuerySchema, validateQuery } from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { logAdminCollectionCapHit } from '../../../utils/admin/adminCollectionLimit'

export default defineEventHandler(async (event) => {
  const { limit, offset } = validateQuery(event, adminCollectionQuerySchema)
  const resolvedLimit = limit ?? 500
  const resolvedOffset = offset ?? 0

  const [items, countResult] = await Promise.all([
    db.query.financialReports.findMany({
      orderBy: desc(financialReports.approvedAt),
      with: { translations: true },
      limit: resolvedLimit,
      offset: resolvedOffset,
    }),
    db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(financialReports),
  ])

  const normalizedItems = items.map((item) => ({
    ...item,
    approvedAt: dateValueToDateOnly(item.approvedAt),
  }))
  const total = countResult[0]?.count ?? 0
  logAdminCollectionCapHit(event, 'financial-reports', {
    limit: resolvedLimit,
    offset: resolvedOffset,
    total,
  })

  return {
    data: normalizedItems,
    meta: { total },
  }
})
