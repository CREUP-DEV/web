import { defineEventHandler } from 'h3'
import { and, asc, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../../../db'
import { areaReports } from '../../../db/schema'
import {
  adminAreaReportListQuerySchema,
  adminCollectionQuerySchema,
  validateQuery,
} from '../../../utils/validation'
import { toExternalImageProxyUrl } from '../../../utils/external/externalAssetUrl'
import { AREA_REPORTS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const adminAreaReportQuerySchema = adminAreaReportListQuerySchema.merge(adminCollectionQuerySchema)

export default defineEventHandler(async (event) => {
  const { month, limit, offset } = validateQuery(event, adminAreaReportQuerySchema)

  const conditions: SQL[] = []
  if (month) {
    conditions.push(eq(areaReports.monthKey, month))
  }
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [items, countResult] = await Promise.all([
    db.query.areaReports.findMany({
      where: whereClause,
      orderBy: [
        desc(areaReports.monthKey),
        asc(areaReports.areaOrderSnapshot),
        asc(areaReports.areaId),
      ],
      limit,
      offset,
      with: { translations: true, edition: true },
    }),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(areaReports)
      .where(whereClause),
  ])

  return {
    data: items.map((item) => ({
      ...item,
      listThumbnailUrl: item.image
        ? (toExternalImageProxyUrl(item.image, {
            publicPathBase: AREA_REPORTS_IMAGE_PUBLIC_BASE,
          }) ?? item.image)
        : null,
    })),
    meta: { total: countResult[0]?.count ?? 0 },
  }
})
