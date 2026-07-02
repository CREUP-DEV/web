import { and, desc, eq, lt, or, type SQL } from 'drizzle-orm'
import { db } from '../../db'
import { activityEntries, areaReportEditions, areaReports } from '../../db/schema'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/cache/externalApiCache'
import {
  ACTIVITY_PUBLIC_BASE_PATH,
  AREA_REPORTS_PUBLIC_BASE_PATH,
} from '~~/shared/constants/activity'
import { buildLocalizedAlternatesForLocaleCodes } from '~~/shared/utils/locale'
import { getRequestLocaleContext } from '../../utils/locale/requestLocale'

const ACTIVITY_BATCH_SIZE = 1000

function buildI18nEntry(
  loc: string,
  locales: ReturnType<typeof getRequestLocaleContext>['locales'],
  defaultLocale: string,
  translatedLocales: Iterable<string> | null | undefined,
  extra: Record<string, unknown> = {}
) {
  return {
    loc,
    _sitemap: 'activity',
    _i18n: {
      alternatives: buildLocalizedAlternatesForLocaleCodes(
        loc,
        locales,
        defaultLocale,
        translatedLocales
      ),
    },
    ...extra,
  }
}

function buildActivityWhereClause(cursor?: { startDate: string; id: string }) {
  const conditions: SQL[] = [eq(activityEntries.active, true)]
  if (cursor) {
    const cursorCondition = or(
      lt(activityEntries.startDate, cursor.startDate),
      and(eq(activityEntries.startDate, cursor.startDate), lt(activityEntries.id, cursor.id))
    )
    if (cursorCondition) {
      conditions.push(cursorCondition)
    }
  }
  return and(...conditions)
}

export default defineSitemapEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)
  const { locales, defaultLocale } = getRequestLocaleContext(event)

  const routes: ReturnType<typeof buildI18nEntry>[] = []

  // Activity detail pages, batched so the source never pulls the whole table at once.
  let cursor: { startDate: string; id: string } | undefined
  while (true) {
    const batch = await db.query.activityEntries.findMany({
      where: buildActivityWhereClause(cursor),
      columns: { id: true, slug: true, startDate: true, updatedAt: true },
      orderBy: [desc(activityEntries.startDate), desc(activityEntries.id)],
      limit: ACTIVITY_BATCH_SIZE,
      with: { translations: { columns: { locale: true } } },
    })

    if (batch.length === 0) {
      break
    }

    for (const entry of batch) {
      routes.push(
        buildI18nEntry(
          `${ACTIVITY_PUBLIC_BASE_PATH}/${entry.slug}`,
          locales,
          defaultLocale,
          entry.translations.map((translation) => translation.locale),
          { lastmod: new Date(entry.updatedAt ?? entry.startDate).toISOString() }
        )
      )
    }

    const last = batch[batch.length - 1]!
    cursor = { startDate: last.startDate, id: last.id }
    if (batch.length < ACTIVITY_BATCH_SIZE) {
      break
    }
  }

  // Area-report month pages — one per edition that still has an active report.
  const editions = await db
    .selectDistinct({ monthKey: areaReportEditions.monthKey })
    .from(areaReportEditions)
    .innerJoin(
      areaReports,
      and(eq(areaReports.monthKey, areaReportEditions.monthKey), eq(areaReports.active, true))
    )
    .orderBy(desc(areaReportEditions.monthKey))

  for (const edition of editions) {
    routes.push(
      buildI18nEntry(
        `${AREA_REPORTS_PUBLIC_BASE_PATH}/${edition.monthKey}`,
        locales,
        defaultLocale,
        locales.map((locale) => locale.code)
      )
    )
  }

  return routes
})
