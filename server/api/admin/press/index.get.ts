import { defineEventHandler } from 'h3'
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles, pressArticleTranslations } from '../../../db/schema'
import {
  adminPressListQuerySchema,
  paginationQuerySchema,
  validateQuery,
} from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import {
  getPressDefaultCoversRow,
  resolvePressArticleListImage,
} from '../../../utils/admin/siteDefaultImages'

const adminPressQuerySchema = adminPressListQuerySchema.merge(paginationQuerySchema)
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
  const query = validateQuery(event, adminPressQuerySchema)
  const { type, search, limit, offset } = query

  // Build WHERE conditions
  const conditions: SQL[] = []

  if (type) {
    conditions.push(eq(pressArticles.type, type))
  }

  if (search) {
    const normalizedSearch = search.trim()

    if (normalizedSearch) {
      const pattern = `%${escapeLikePattern(normalizedSearch)}%`
      // The wrapping parentheses are load-bearing: `and()` embeds this fragment verbatim, so a bare
      // `or` would bind looser than the correlation and match every row.
      const translationSearchCondition = sql`(${pressArticleTranslations.title} ilike ${pattern} escape '\\' or ${pressArticleTranslations.description} ilike ${pattern} escape '\\')`

      conditions.push(
        sql`exists (
          select 1
          from ${pressArticleTranslations}
          where ${and(
            eq(pressArticleTranslations.pressArticleId, pressArticles.id),
            translationSearchCondition
          )}
        )`
      )
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined
  const orderBy = [desc(pressArticles.publishedAt), desc(pressArticles.id)]

  /**
   * The page is resolved in two steps on purpose. The relational query API rewrites every column
   * reference inside a raw `sql` fragment to the outer table's alias, which breaks the correlated
   * `exists` the search filter relies on, so the filter runs through the plain select builder and
   * only the matching ids reach `findMany` — which still assembles the nested shape the list needs.
   */
  let pageIdsQuery = db
    .select({ id: pressArticles.id })
    .from(pressArticles)
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

  const [pageIds, countResult, pressDefaults] = await Promise.all([
    pageIdsQuery,
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(pressArticles)
      .where(whereClause),
    getPressDefaultCoversRow(),
  ])

  const items = pageIds.length
    ? await db.query.pressArticles.findMany({
        where: inArray(
          pressArticles.id,
          pageIds.map((row) => row.id)
        ),
        orderBy,
        columns: {
          id: true,
          type: true,
          slug: true,
          image: true,
          pdfUrl: true,
          externalUrl: true,
          mediaOutletId: true,
          active: true,
          publishedAt: true,
          updatedAt: true,
        },
        with: {
          translations: {
            columns: {
              id: true,
              locale: true,
              title: true,
              description: true,
              alt: true,
              pressArticleId: true,
            },
          },
          tags: {
            columns: {
              id: true,
              pressArticleId: true,
              tagId: true,
            },
            with: {
              tag: {
                columns: {
                  id: true,
                  slug: true,
                },
                with: {
                  translations: {
                    columns: {
                      id: true,
                      locale: true,
                      name: true,
                      tagId: true,
                    },
                  },
                },
              },
            },
          },
          mediaOutlet: {
            columns: {
              id: true,
              name: true,
              website: true,
              logo: true,
            },
          },
        },
      })
    : []

  return {
    data: items.map((item) => ({
      ...item,
      publishedAt: dateValueToDateOnly(item.publishedAt),
      listThumbnailUrl: resolvePressArticleListImage(item.type, item.image, pressDefaults),
    })),
    meta: {
      total: countResult[0]?.count ?? 0,
    },
  }
})
