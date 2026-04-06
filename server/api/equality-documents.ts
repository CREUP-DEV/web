import { createError, setHeader } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { equalityDocuments } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { logError } from '../utils/logger'
import { pickLocalizedEntry } from '~~/shared/utils/locale'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const { locale, locales, fallbackLocale } = getRequestLocaleContext(event)

    try {
      const items = await db.query.equalityDocuments.findMany({
        where: eq(equalityDocuments.active, true),
        orderBy: asc(equalityDocuments.order),
        with: {
          translations: true,
        },
      })

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
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.equality-documents.database-unavailable', error, undefined, event)
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
    getKey: (event) => buildPublicRouteCacheKey(event, 'public-equality-documents'),
  }
)
