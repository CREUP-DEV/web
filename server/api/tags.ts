import { createError, setHeader } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../db'
import { tags } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)

    try {
      const tagsList = await db.query.tags.findMany({
        orderBy: asc(tags.order),
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
          statusMessage: 'Servicio temporalmente no disponible',
        })
      }

      throw error
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-tags'),
  }
)
