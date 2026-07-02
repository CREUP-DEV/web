import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { areaReportEditions, areaReports } from '../db/schema'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { toExternalImageProxyUrl } from '../utils/external/externalAssetUrl'
import { AREA_REPORTS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
} from '~~/shared/constants/siteDefaultImages'
import {
  loadSiteDefaultImageEntriesMap,
  resolveSiteDefaultImageUrlWithVersion,
} from '../utils/admin/siteDefaultImages'
import { resolveAreaReportTranslation } from '../utils/activity/activityTranslation'
import { getRequestLocaleContext } from '../utils/locale/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
  setPublicRouteVaryHeaders,
} from '../utils/cache/publicRouteCache'
import { areaReportsMonthQuerySchema, validatePublicQuery } from '../utils/validation'
import { throwPublicDatabaseAwareError } from '../utils/public/publicErrors'
import { appendAssetVersion } from '../utils/core/assetVersion'

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    setPublicRouteVaryHeaders(event)
    const { locale, fallbackLocale } = getRequestLocaleContext(event)
    // `month` is the edition anchor (its month_key). Covered-but-not-anchor months are mapped to
    // their anchor by /api/area-reports/months before linking here.
    const { month } = validatePublicQuery(event, areaReportsMonthQuerySchema)

    try {
      const edition = await db.query.areaReportEditions.findFirst({
        where: eq(areaReportEditions.monthKey, month),
      })

      if (!edition) {
        return { data: { edition: null, reports: [] } }
      }

      const [reports, siteDefaultImageEntries] = await Promise.all([
        db.query.areaReports.findMany({
          where: and(eq(areaReports.monthKey, month), eq(areaReports.active, true)),
          orderBy: [asc(areaReports.areaOrderSnapshot), asc(areaReports.areaId)],
          with: {
            translations: {
              columns: { locale: true, contentHtml: true, imageCaption: true, alt: true },
            },
          },
        }),
        loadSiteDefaultImageEntriesMap(),
      ])

      const defaultImage = resolveSiteDefaultImageUrlWithVersion(
        siteDefaultImageEntries,
        SITE_DEFAULT_IMAGE_SCOPE.areaReport,
        SITE_DEFAULT_IMAGE_SLOT.areaReport
      )

      const items = reports.map((report) => {
        const trans = resolveAreaReportTranslation(report.translations, locale, fallbackLocale)
        return {
          id: report.id,
          areaId: report.areaId,
          areaName: pickLocalizedValue(report.areaNameSnapshot, locale, fallbackLocale) ?? '',
          areaOrder: report.areaOrderSnapshot,
          image: report.image
            ? appendAssetVersion(
                toExternalImageProxyUrl(report.image, {
                  publicPathBase: AREA_REPORTS_IMAGE_PUBLIC_BASE,
                }) ?? report.image,
                report.updatedAt
              )
            : defaultImage,
          contentHtml: trans.contentHtml ?? null,
          contentLocale: trans.contentLocale,
          imageCaption: trans.imageCaption,
          imageCaptionLocale: trans.imageCaptionLocale,
          alt: trans.alt,
        }
      })

      return {
        data: {
          edition: { monthKey: edition.monthKey, coversFrom: edition.coversFrom },
          reports: items,
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.area-reports', error, { month })
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-area-reports', { queryKeys: ['month'] }),
  }
)
