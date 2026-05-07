import { defineEventHandler } from 'h3'
import { and, desc, eq, sql, type SQL } from 'drizzle-orm'
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
const MIN_TRIGRAM_SEARCH_LENGTH = 3

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
      // For short queries, keep explicit ESCAPE so backslash behavior is intentional.
      const translationSearchCondition =
        normalizedSearch.length >= MIN_TRIGRAM_SEARCH_LENGTH
          ? sql`${pressArticleTranslations.title} % ${normalizedSearch} or ${pressArticleTranslations.description} % ${normalizedSearch}`
          : sql`${pressArticleTranslations.title} ilike ${pattern} escape '\\' or ${pressArticleTranslations.description} ilike ${pattern} escape '\\'`

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

  const [items, countResult, pressDefaults] = await Promise.all([
    db.query.pressArticles.findMany({
      where: whereClause,
      orderBy: [desc(pressArticles.publishedAt), desc(pressArticles.id)],
      limit,
      offset,
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
    }),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(pressArticles)
      .where(whereClause),
    getPressDefaultCoversRow(),
  ])

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
