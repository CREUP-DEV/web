import { createError, setHeader } from 'h3'
import { and, asc, eq, inArray, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles, pressArticleTags, tags } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/publicRouteCache'
import { tagsListQuerySchema, validateQuery } from '../utils/validation'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const query = validateQuery(event, tagsListQuerySchema)
    const type = query.type

    try {
      const articleConditions: SQL[] = [eq(pressArticles.active, true)]

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
        with: { translations: true },
      })

      return {
        tags: tagsList.map((tag) => {
          const trans = pickLocalizedEntry(tag.translations, locale, locales, fallbackLocale)
          return {
            slug: tag.slug,
            name: trans?.name ?? tag.slug,
          }
        }),
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.tags.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throw error
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
