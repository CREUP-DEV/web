import { createError, setHeader } from 'h3'
import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { equalityDocuments } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { getRequestLocaleContext } from '../utils/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/publicRouteCache'
import { publicPaginationQuerySchema, validateQuery } from '../utils/validation'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const { limit, offset } = validateQuery(event, publicPaginationQuerySchema)

    try {
      const activeWhere = eq(equalityDocuments.active, true)

      const [items, countResult] = await Promise.all([
        db.query.equalityDocuments.findMany({
          where: activeWhere,
          orderBy: [asc(equalityDocuments.order), asc(equalityDocuments.id)],
          limit,
          offset,
          with: {
            translations: true,
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(equalityDocuments)
          .where(activeWhere),
      ])

      return {
        items: items.map((item) => {
          const translation = pickLocalizedEntry(item.translations, locale, locales, fallbackLocale)

          return {
            id: item.id,
            title: translation?.title ?? '',
            description: translation?.description ?? '',
            meta: translation?.meta ?? '',
            pdfUrl:
              toExternalPdfProxyUrl(item.pdfUrl, {
                publicPathBase: EQUALITY_DOCUMENTS_PUBLIC_PATH,
              }) ?? item.pdfUrl,
          }
        }),
        total: countResult[0]?.count ?? 0,
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.equality-documents.database-unavailable', error, undefined, event)
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
      buildPublicRouteCacheKey(event, 'public-equality-documents', {
        queryKeys: ['limit', 'offset'],
      }),
  }
)
