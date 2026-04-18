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
import { publicPaginationQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwSafePublicError } from '../utils/publicErrors'
import { appendAssetVersion } from '../utils/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const { limit, offset } = validatePublicQuery(event, publicPaginationQuerySchema)

    try {
      const activeWhere = eq(equalityDocuments.active, true)

      const [items, countResult] = await Promise.all([
        db.query.equalityDocuments.findMany({
          where: activeWhere,
          orderBy: [asc(equalityDocuments.order), asc(equalityDocuments.id)],
          limit,
          offset,
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                description: true,
                meta: true,
              },
            },
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
            pdfUrl: appendAssetVersion(
              toExternalPdfProxyUrl(item.pdfUrl, {
                publicPathBase: EQUALITY_DOCUMENTS_PUBLIC_PATH,
              }) ?? item.pdfUrl,
              item.updatedAt
            ),
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

      throwSafePublicError(event, 'public.equality-documents.unexpected-error', error)
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
