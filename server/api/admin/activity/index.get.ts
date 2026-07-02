import { defineEventHandler } from 'h3'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
import { db } from '../../../db'
import { activityEntries, activityEntryTranslations } from '../../../db/schema'
import {
  adminActivityListQuerySchema,
  paginationQuerySchema,
  validateQuery,
} from '../../../utils/validation'
import { toExternalImageProxyUrl } from '../../../utils/external/externalAssetUrl'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const adminActivityQuerySchema = adminActivityListQuerySchema.merge(paginationQuerySchema)
const MIN_TRIGRAM_SEARCH_LENGTH = 3

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  const { kind, search, limit, offset } = validateQuery(event, adminActivityQuerySchema)

  const conditions: SQL[] = []

  if (kind) {
    conditions.push(eq(activityEntries.kind, kind))
  }

  if (search) {
    const normalizedSearch = search.trim()
    if (normalizedSearch) {
      const pattern = `%${escapeLikePattern(normalizedSearch)}%`
      const translationSearchCondition =
        normalizedSearch.length >= MIN_TRIGRAM_SEARCH_LENGTH
          ? sql`${activityEntryTranslations.title} % ${normalizedSearch} or ${activityEntryTranslations.excerpt} % ${normalizedSearch}`
          : sql`${activityEntryTranslations.title} ilike ${pattern} escape '\\' or ${activityEntryTranslations.excerpt} ilike ${pattern} escape '\\'`

      conditions.push(
        sql`exists (
          select 1
          from ${activityEntryTranslations}
          where ${and(
            eq(activityEntryTranslations.activityEntryId, activityEntries.id),
            translationSearchCondition
          )}
        )`
      )
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [items, countResult] = await Promise.all([
    db.query.activityEntries.findMany({
      where: whereClause,
      orderBy: [desc(activityEntries.startDate), desc(activityEntries.id)],
      limit,
      offset,
      with: { translations: true },
    }),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(activityEntries)
      .where(whereClause),
  ])

  return {
    data: items.map((item) => ({
      ...item,
      listThumbnailUrl: item.image
        ? (toExternalImageProxyUrl(item.image, { publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE }) ??
          item.image)
        : null,
    })),
    meta: { total: countResult[0]?.count ?? 0 },
  }
})
