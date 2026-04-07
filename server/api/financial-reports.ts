import { createError, setHeader } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { financialReports } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'
import { publicPaginationQuerySchema, validateQuery } from '../utils/validation'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)
    const { limit, offset } = validateQuery(event, publicPaginationQuerySchema)

    try {
      const activeWhere = eq(financialReports.active, true)

      const [items, countResult] = await Promise.all([
        db.query.financialReports.findMany({
          where: activeWhere,
          orderBy: desc(financialReports.approvedAt),
          limit,
          offset,
          with: {
            translations: true,
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(financialReports)
          .where(activeWhere),
      ])

      return {
        items: items.map((item) => ({
          id: item.id,
          title:
            pickLocalizedEntry(item.translations, locale, locales, fallbackLocale)?.title ?? '',
          pdfUrl:
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/documentos/informes-economicos',
            }) ?? item.pdfUrl,
          approvedAt: dateValueToDateOnly(item.approvedAt),
        })),
        total: countResult[0]?.count ?? 0,
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

      throw error
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
