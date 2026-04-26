import { createError, setHeader } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { financialReports } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/core/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { logError } from '../utils/core/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { publicPaginationQuerySchema, validatePublicQuery } from '../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'
import { throwSafePublicError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const { limit, offset } = validatePublicQuery(event, publicPaginationQuerySchema)

    try {
      const activeWhere = eq(financialReports.active, true)

      const [items, countResult] = await Promise.all([
        db.query.financialReports.findMany({
          where: activeWhere,
          orderBy: [desc(financialReports.approvedAt), desc(financialReports.id)],
          limit,
          offset,
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
              },
            },
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(financialReports)
          .where(activeWhere),
      ])

      return {
        data: items.map((item) => ({
          id: item.id,
          title:
            pickLocalizedEntry(item.translations, locale, locales, fallbackLocale)?.title ?? '',
          pdfUrl: appendAssetVersion(
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/documentos/informes-economicos',
            }) ?? item.pdfUrl,
            item.updatedAt
          ),
          approvedAt: dateValueToDateOnly(item.approvedAt),
        })),
        meta: {
          total: countResult[0]?.count ?? 0,
        },
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.financial-reports.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.financial-reports.unexpected-error', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-financial-reports', {
        queryKeys: ['limit', 'offset'],
      }),
  }
)
