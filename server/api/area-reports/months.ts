import { and, desc, eq } from 'drizzle-orm'
import { db } from '../../db'
import { areaReportEditions, areaReports } from '../../db/schema'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
} from '../../utils/cache/publicRouteCache'
import { throwPublicDatabaseAwareError } from '../../utils/public/publicErrors'

/** Expand a 'YYYY-MM'..'YYYY-MM' inclusive range into its list of 'YYYY-MM' months. */
function expandMonths(coversFrom: string | null, monthKey: string): string[] {
  const [startYear, startMonth] = (coversFrom ?? monthKey).split('-')
  const [endYearRaw, endMonthRaw] = monthKey.split('-')
  let year = Number(startYear)
  let month = Number(startMonth)
  const endYear = Number(endYearRaw)
  const endMonth = Number(endMonthRaw)
  const months: string[] = []

  while (year < endYear || (year === endYear && month <= endMonth)) {
    months.push(`${year}-${String(month).padStart(2, '0')}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)

    try {
      // Editions that still have at least one active report.
      const rows = await db
        .selectDistinct({
          monthKey: areaReportEditions.monthKey,
          coversFrom: areaReportEditions.coversFrom,
        })
        .from(areaReportEditions)
        .innerJoin(
          areaReports,
          and(eq(areaReports.monthKey, areaReportEditions.monthKey), eq(areaReports.active, true))
        )
        .orderBy(desc(areaReportEditions.monthKey))

      // The DB exclusion constraint guarantees edition ranges never overlap, so each covered month
      // maps unambiguously to a single anchor (plan §4.2/§5.1).
      const coveredToAnchor: Record<string, string> = {}
      for (const edition of rows) {
        for (const month of expandMonths(edition.coversFrom, edition.monthKey)) {
          coveredToAnchor[month] = edition.monthKey
        }
      }

      return {
        data: {
          anchors: rows.map((edition) => ({
            monthKey: edition.monthKey,
            coversFrom: edition.coversFrom,
          })),
          coveredToAnchor,
        },
      }
    } catch (error) {
      throwPublicDatabaseAwareError(event, 'public.area-reports-months', error)
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-area-reports-months', { includeLocale: false }),
  }
)
