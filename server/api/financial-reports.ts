import { createError, setHeader } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { financialReports } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'
import { dateValueToDateOnly } from '~~/shared/utils/date'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)

    try {
      const items = await db.query.financialReports.findMany({
        where: eq(financialReports.active, true),
        orderBy: desc(financialReports.approvedAt),
        with: {
          translations: true,
        },
      })

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
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.financial-reports.database-unavailable', error, undefined, event)
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
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-financial-reports'),
  }
)
