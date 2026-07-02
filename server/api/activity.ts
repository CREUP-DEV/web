import { getQuery } from 'h3'
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm'
import { db } from '../db'
import { activityEntries, activityEntryTranslations } from '../db/schema'
import { toExternalImageProxyUrl } from '../utils/external/externalAssetUrl'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import {
  loadSiteDefaultImageEntriesMap,
  resolveSiteDefaultImageUrlWithVersion,
} from '../utils/admin/siteDefaultImages'
import { resolveActivityTranslationSummary } from '../utils/activity/activityTranslation'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { activityListQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

function escapeLikePattern(value: string) {
  return value.replace(/[%_\\]/g, '\\$&')
}

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    setPublicRouteVaryHeaders(event)
    const { locale, fallbackLocale } = getRequestLocaleContext(event)
    const query = validatePublicQuery(event, activityListQuerySchema)
    const { kind, month, limit, offset } = query
    const search = query.q?.trim()

    try {
      const conditions: SQL[] = [eq(activityEntries.active, true)]

      if (kind) {
        conditions.push(eq(activityEntries.kind, kind))
      }

      if (month) {
        conditions.push(sql`to_char(${activityEntries.startDate}, 'YYYY-MM') = ${month}`)
      }

      if (search) {
        const pattern = `%${escapeLikePattern(search)}%`
        const searchLocales = [...new Set([locale, fallbackLocale])]
        const entryIdsBySearch = db
          .select({ activityEntryId: activityEntryTranslations.activityEntryId })
          .from(activityEntryTranslations)
          .where(
            and(
              inArray(activityEntryTranslations.locale, searchLocales),
              sql`(${activityEntryTranslations.title} ilike ${pattern} escape '\\' or ${activityEntryTranslations.excerpt} ilike ${pattern} escape '\\')`
            )
          )

        conditions.push(inArray(activityEntries.id, entryIdsBySearch))
      }

      const whereClause = conditions.length > 1 ? and(...conditions) : conditions[0]

      const [entries, countResult, siteDefaultImageEntries] = await Promise.all([
        db.query.activityEntries.findMany({
          where: whereClause,
          orderBy: [desc(activityEntries.startDate), desc(activityEntries.createdAt)],
          limit,
          offset,
          columns: {
            id: true,
            kind: true,
            slug: true,
            image: true,
            startDate: true,
            endDate: true,
            isOnline: true,
            location: true,
            memberOrgSnapshot: true,
            updatedAt: true,
          },
          with: {
            translations: {
              columns: { locale: true, title: true, excerpt: true, alt: true, imageCaption: true },
            },
          },
        }),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(activityEntries)
          .where(whereClause),
        loadSiteDefaultImageEntriesMap(),
      ])

      const defaultImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.activity,
        SITE_DEFAULT_IMAGE_SLOT.activityEntry
      )

      const items = entries.map((item) => {
        const trans = resolveActivityTranslationSummary(item.translations, locale, fallbackLocale)
        return {
          id: item.id,
          kind: item.kind,
          slug: item.slug,
          image: item.image
            ? appendAssetVersion(
                toExternalImageProxyUrl(item.image, {
                  publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE,
                }) ?? item.image,
                item.updatedAt
              )
            : defaultImage,
          startDate: item.startDate,
          endDate: item.endDate,
          isOnline: item.isOnline,
          location: item.location,
          title: trans.title,
          excerpt: trans.excerpt,
          alt: trans.alt,
          imageCaption: trans.imageCaption,
          titleLocale: trans.titleLocale,
          excerptLocale: trans.excerptLocale,
          memberOrg:
            item.kind === 'member' && item.memberOrgSnapshot
              ? {
                  denomination: item.memberOrgSnapshot.denomination,
                  initials: item.memberOrgSnapshot.initials,
                  logoLight: item.memberOrgSnapshot.logoLight,
                  logoDark: item.memberOrgSnapshot.logoDark,
                }
              : null,
        }
      })

      return {
        data: items,
        meta: { total: countResult[0]?.count ?? 0 },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.activity', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    // Free-text search has unbounded cardinality, so never cache search responses.
    shouldBypassCache: (event) => {
      const raw = getQuery(event).q
      const q = Array.isArray(raw) ? raw[0] : raw
      return typeof q === 'string' && q.trim().length > 0
    },
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-activity', {
        queryKeys: ['kind', 'month', 'limit', 'offset'],
      }),
  }
)
