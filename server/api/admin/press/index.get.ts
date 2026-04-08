import { defineEventHandler } from 'h3'
import { and, desc, eq, inArray, or, ilike, sql } from 'drizzle-orm'
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

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, adminPressQuerySchema)
  const { type, search, limit, offset } = query

  // Build WHERE conditions
  const conditions = []

  if (type) {
    conditions.push(eq(pressArticles.type, type))
  }

  if (search) {
    const pattern = `%${search}%`
    const matchingIds = await db
      .selectDistinct({ id: pressArticleTranslations.pressArticleId })
      .from(pressArticleTranslations)
      .where(
        or(
          ilike(pressArticleTranslations.title, pattern),
          ilike(pressArticleTranslations.description, pattern)
        )
      )

    const idList = matchingIds.map((r) => r.id)

    if (idList.length === 0) {
      return { items: [], total: 0 }
    }

    conditions.push(inArray(pressArticles.id, idList))
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
