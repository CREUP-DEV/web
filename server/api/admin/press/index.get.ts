import { defineEventHandler } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
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
  const { type, limit, offset } = query

  const whereClause = type ? eq(pressArticles.type, type) : undefined

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
