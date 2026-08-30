import { defineEventHandler, getQuery } from 'h3'
import { asc } from 'drizzle-orm'
import { z } from 'zod'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { db } from '../../db'
import { areaCatalogEntries } from '../../db/schema'
import { syncAreaCatalog } from '../../utils/admin/catalogSync'
import { getRequestLocaleContext } from '../../utils/locale/requestLocale'

/**
 * Admin area dropdown for area-reports. Backed by the local area catalog
 * (server/db/schema/catalog.ts), which mirrors the org chart's whole mandate history, so an area
 * retired mandates ago is still offered when editing an old report.
 *
 * With `?month=YYYY-MM` the list narrows to the mandates in force during that month. A month the
 * hand-over falls inside overlaps two mandates and returns both, since either set is a legitimate
 * answer for that report.
 *
 * Response shape is load-bearing: AdminAreaReportForm.vue sends `id` straight through as
 * `areaId`. `id` here is the catalog row's `selectionKey` (the `area_term_id` frozen into
 * `areaReports.areaId`), not the catalog row's own internal id.
 */
const monthQuerySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/)
    .optional(),
})

/** Last calendar day of `YYYY-MM`, as `YYYY-MM-DD`. */
const endOfMonth = (month: string) => {
  const [year, monthIndex] = month.split('-').map(Number)
  return new Date(Date.UTC(year!, monthIndex!, 0)).toISOString().slice(0, 10)
}

export default defineEventHandler(async (event) => {
  const { month } = monthQuerySchema.parse(getQuery(event))
  await syncAreaCatalog(event)

  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const rows = await db.query.areaCatalogEntries.findMany({
    orderBy: [asc(areaCatalogEntries.mandateStartDate), asc(areaCatalogEntries.order)],
  })

  // A mandate is in force during the month when it starts on or before the month ends and has not
  // finished before the month begins.
  const monthStart = month ? `${month}-01` : null
  const monthEnd = month ? endOfMonth(month) : null
  const inForce = (row: (typeof rows)[number]) =>
    !monthStart ||
    !monthEnd ||
    (row.mandateStartDate <= monthEnd &&
      (row.mandateEndDate === null || row.mandateEndDate >= monthStart))

  const visible = month ? rows.filter(inForce) : rows

  return {
    data: visible.map((row) => ({
      id: row.selectionKey,
      name: pickLocalizedValue(row.nameTranslations, locale, fallbackLocale) ?? '',
      nameTranslations: row.nameTranslations,
      order: row.order,
      active: row.active,
      mandateId: row.mandateId,
      mandateStartDate: row.mandateStartDate,
      mandateEndDate: row.mandateEndDate,
    })),
    meta: { generatedAt: new Date().toISOString() },
  }
})
