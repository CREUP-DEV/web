import { defineEventHandler } from 'h3'
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles, pressArticleTranslations } from '../../../db/schema'
import { sanitizePressTranslations } from '../../../utils/pressTranslation'
import {
  adminPressListQuerySchema,
  paginationQuerySchema,
  validateQuery,
} from '../../../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

const adminPressQuerySchema = adminPressListQuerySchema.merge(paginationQuerySchema)

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
    const pattern = `%${escapeLikePattern(search)}%`
    conditions.push(
      sql`exists (
        select 1
        from ${pressArticleTranslations}
        where ${and(
          eq(pressArticleTranslations.pressArticleId, pressArticles.id),
          or(
            ilike(pressArticleTranslations.title, pattern),
            ilike(pressArticleTranslations.description, pattern)
          )
        )}
      )`
    )
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const [items, countResult] = await Promise.all([
    db.query.pressArticles.findMany({
      where: whereClause,
      orderBy: desc(pressArticles.publishedAt),
      limit,
      offset,
      with: {
        translations: true,
        tags: {
          with: {
            tag: { with: { translations: true } },
          },
        },
        mediaOutlet: true,
      },
    }),
    db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(pressArticles)
      .where(whereClause),
  ])

  return {
    items: items.map((item) => ({
      ...item,
      publishedAt: dateValueToDateOnly(item.publishedAt),
      translations: sanitizePressTranslations(item.translations),
    })),
    total: countResult[0]?.count ?? 0,
  }
})
