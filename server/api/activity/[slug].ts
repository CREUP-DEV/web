import { createError, getRouterParam } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { activityEntries } from '../../db/schema'
import { getBaseLanguage } from '~~/shared/utils/locale'
import { toExternalImageProxyUrl } from '../../utils/external/externalAssetUrl'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import {
  loadSiteDefaultImageEntriesMap,
  resolveSiteDefaultImageUrlWithVersion,
} from '../../utils/admin/siteDefaultImages'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import { throwPublicDatabaseAwareError } from '../../utils/public/publicErrors'
import { resolveActivityTranslation } from '../../utils/activity/activityTranslation'
import { getRequestLocaleContext } from '../../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../../utils/cache/publicRouteCache'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import { appendAssetVersion } from '../../utils/core/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { locale, fallbackLocale } = getRequestLocaleContext(event)
    const { slug } = validatePublicRouteParams(event, slugRouteParamSchema)

    try {
      const [entry, siteDefaultImageEntries] = await Promise.all([
        db.query.activityEntries.findFirst({
          where: and(eq(activityEntries.slug, slug), eq(activityEntries.active, true)),
          with: {
            translations: {
              columns: {
                locale: true,
                title: true,
                excerpt: true,
                alt: true,
                imageCaption: true,
                contentHtml: true,
              },
            },
          },
        }),
        loadSiteDefaultImageEntriesMap(),
      ])

      if (!entry) {
        throw createError({
          statusCode: 404,
          message: getPublicApiErrorMessage(event, 'articleNotFound'),
        })
      }

      const trans = resolveActivityTranslation(entry.translations, locale, fallbackLocale)

      const defaultImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.activity,
        SITE_DEFAULT_IMAGE_SLOT.activityEntry
      )

      // Locale codes that have an actual native translation stored.
      const translatedLocales = entry.translations
        .map((translation) => getBaseLanguage(translation.locale))
        .filter((code): code is string => !!code)

      return {
        data: {
          id: entry.id,
          kind: entry.kind,
          slug: entry.slug,
          image: entry.image
            ? appendAssetVersion(
                toExternalImageProxyUrl(entry.image, {
                  publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE,
                }) ?? entry.image,
                entry.updatedAt
              )
            : defaultImage,
          startDate: entry.startDate,
          endDate: entry.endDate,
          isOnline: entry.isOnline,
          location: entry.location,
          title: trans.title,
          excerpt: trans.excerpt,
          alt: trans.alt,
          imageCaption: trans.imageCaption,
          contentHtml: trans.contentHtml ?? null,
          titleLocale: trans.titleLocale,
          excerptLocale: trans.excerptLocale,
          imageCaptionLocale: trans.imageCaptionLocale,
          contentLocale: trans.contentLocale,
          publishedAt: entry.startDate,
          updatedAt: entry.updatedAt?.toISOString() ?? null,
          translatedLocales,
          memberOrg:
            entry.kind === 'member' && entry.memberOrgSnapshot
              ? {
                  denomination: entry.memberOrgSnapshot.denomination,
                  initials: entry.memberOrgSnapshot.initials,
                  logoLight: entry.memberOrgSnapshot.logoLight,
                  logoDark: entry.memberOrgSnapshot.logoDark,
                }
              : null,
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.activity-detail', error, { slug })
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(
        event,
        `public-activity-detail:${encodeURIComponent(getRouterParam(event, 'slug') ?? '')}`
      ),
  }
)
