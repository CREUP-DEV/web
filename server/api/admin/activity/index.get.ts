import { defineEventHandler } from 'h3'
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
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
/**
 * Substring search, never the trigram `%` operator. `%` compares whole-string similarity against a
 * 0.3 threshold, so a single word never clears it against a long title: measured on this database,
 * "estudiantes" matched 2 of 464 press articles where `ilike` matched 217. The gin_trgm_ops indexes
 * accelerate `ilike '%...%'` regardless.
 */
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
      // The wrapping parentheses are load-bearing: `and()` embeds this fragment verbatim, so a bare
      // `or` would bind looser than the correlation and match every row.
      const translationSearchCondition = sql`(${activityEntryTranslations.title} ilike ${pattern} escape '\\' or ${activityEntryTranslations.excerpt} ilike ${pattern} escape '\\')`

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
  const orderBy = [desc(activityEntries.startDate), desc(activityEntries.id)]

  /**
   * The page is resolved in two steps on purpose. The relational query API rewrites every column
   * reference inside a raw `sql` fragment to the outer table's alias, which breaks the correlated
   * `exists` the search filter relies on, so the filter runs through the plain select builder and
   * only the matching ids reach `findMany` — which still loads the translations alongside the row.
   */
  let pageIdsQuery = db
    .select({ id: activityEntries.id })
    .from(activityEntries)
    .where(whereClause)
    .orderBy(...orderBy)
    .$dynamic()

  // `limit` and `offset` are optional in the query schema; leaving either out means no window.
  if (limit !== undefined) {
    pageIdsQuery = pageIdsQuery.limit(limit)
  }

  if (offset !== undefined) {
    pageIdsQuery = pageIdsQuery.offset(offset)
  }

  const [pageIds, countResult] = await Promise.all([
    pageIdsQuery,
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(activityEntries)
      .where(whereClause),
  ])

  const items = pageIds.length
    ? await db.query.activityEntries.findMany({
        where: inArray(
          activityEntries.id,
          pageIds.map((row) => row.id)
        ),
        orderBy,
        with: { translations: true },
      })
    : []

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
