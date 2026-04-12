import { createError, setHeader } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/databaseErrors'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
import { monthKeyToDate } from '../utils/newsletters'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/publicRouteCache'
import { publicPaginationQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwSafePublicError } from '../utils/publicErrors'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { limit, offset } = validatePublicQuery(event, publicPaginationQuerySchema)
    const normalizedLimit = limit ?? 12
    const normalizedOffset = offset ?? 0

    try {
      const [items, countResult] = await Promise.all([
        db
          .select({
            id: newsletters.id,
            monthKey: newsletters.monthKey,
            coverImage: newsletters.coverImage,
            pdfUrl: newsletters.pdfUrl,
            publicVisible: newsletters.publicVisible,
          })
          .from(newsletters)
          .where(eq(newsletters.publicVisible, true))
          .orderBy(desc(newsletters.month))
          .limit(normalizedLimit)
          .offset(normalizedOffset),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(newsletters)
          .where(eq(newsletters.publicVisible, true)),
      ])

      return {
        items: items.map((item) => ({
          coverImage:
            toExternalImageProxyUrl(item.coverImage, {
              publicPathBase: '/prensa/newsletter/portadas',
            }) ?? item.coverImage,
          id: item.id,
          month: monthKeyToDate(item.monthKey),
          pdfUrl:
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/prensa/newsletter/documentos',
            }) ?? item.pdfUrl,
          publicVisible: item.publicVisible,
        })),
        total: countResult[0]?.count ?? 0,
      }
    } catch (error) {
      if (isDatabaseUnavailableError(error)) {
        logError('public.newsletter.database-unavailable', error, undefined, event)
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
        })
      }

      throwSafePublicError(event, 'public.newsletter.unexpected-error', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-newsletter-archive', {
        includeLocale: false,
        queryKeys: ['limit', 'offset'],
      }),
  }
)
