import { createError, setHeader } from 'h3'
import { desc, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { newsletters } from '../db/schema'
import { isDatabaseUnavailableError } from '../utils/core/databaseErrors'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { logError } from '../utils/core/logger'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/external/externalAssetUrl'
import { monthKeyToDate } from '../utils/newsletter/newsletters'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import {
  loadSiteDefaultImageEntriesMap,
  resolveSiteDefaultImageUrlWithVersion,
} from '../utils/admin/siteDefaultImages'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { publicPaginationQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwSafePublicError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { limit, offset } = validatePublicQuery(event, publicPaginationQuerySchema)
    const normalizedLimit = limit ?? 12
    const normalizedOffset = offset ?? 0

    try {
      const [items, countResult, siteDefaultImageEntries] = await Promise.all([
        db
          .select({
            id: newsletters.id,
            monthKey: newsletters.monthKey,
            coverImage: newsletters.coverImage,
            pdfUrl: newsletters.pdfUrl,
            publicVisible: newsletters.publicVisible,
            updatedAt: newsletters.updatedAt,
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
        loadSiteDefaultImageEntriesMap(),
      ])

      const defaultCover = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.newsletter,
        SITE_DEFAULT_IMAGE_SLOT.newsletterCover
      )

      return {
        data: items.map((item) => ({
          coverImage: item.coverImage
            ? appendAssetVersion(
                toExternalImageProxyUrl(item.coverImage, {
                  publicPathBase: '/prensa/newsletter/portadas',
                }) ?? item.coverImage,
                item.updatedAt
              )
            : defaultCover,
          id: item.id,
          month: monthKeyToDate(item.monthKey),
          pdfUrl: appendAssetVersion(
            toExternalPdfProxyUrl(item.pdfUrl, {
              publicPathBase: '/prensa/newsletter/documentos',
            }) ?? item.pdfUrl,
            item.updatedAt
          ),
          publicVisible: item.publicVisible,
        })),
        meta: {
          total: countResult[0]?.count ?? 0,
        },
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
