import { asc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { equalityDocuments } from '../db/schema'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { pickLocalizedEntryWithFieldFallback } from '~~/shared/utils/locale'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { publicPaginationQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

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
        data: items.map((item) => {
          const translation = pickLocalizedEntryWithFieldFallback(
            item.translations,
            locale,
            locales,
            fallbackLocale
          )

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
        meta: {
          total: countResult[0]?.count ?? 0,
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.equality-documents', error)
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
