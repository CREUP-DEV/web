import { and, asc, eq, inArray, lte, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, pressArticleTags, tags } from '../db/schema'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { tagsListQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const query = validatePublicQuery(event, tagsListQuerySchema)
    const type = query.type

    try {
      const articleConditions: SQL[] = [
        eq(pressArticles.active, true),
        lte(pressArticles.publishedAt, sql`CURRENT_DATE`),
      ]

      if (type) {
        articleConditions.push(eq(pressArticles.type, type))
      }

      const articleWhereClause =
        articleConditions.length > 1 ? and(...articleConditions) : articleConditions[0]

      const tagIdsWithArticles = db
        .select({ tagId: pressArticleTags.tagId })
        .from(pressArticleTags)
        .innerJoin(pressArticles, eq(pressArticleTags.pressArticleId, pressArticles.id))
        .where(articleWhereClause)
        .groupBy(pressArticleTags.tagId)

      const tagsList = await db.query.tags.findMany({
        where: inArray(tags.id, tagIdsWithArticles),
        orderBy: [asc(tags.order), asc(tags.id)],
        with: {
          translations: {
            columns: {
              locale: true,
              name: true,
            },
          },
        },
      })

      return {
        data: tagsList.map((tag) => {
          const trans = pickLocalizedEntry(tag.translations, locale, locales, fallbackLocale)
          return {
            slug: tag.slug,
            name: trans?.name ?? tag.slug,
          }
        }),
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.tags', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-tags', {
        queryKeys: ['type'],
      }),
  }
)
