import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../../db'
import { areaCatalogEntries } from '../../../db/schema'
import { getCatalogSyncState, syncAreaCatalog } from '../../../utils/admin/catalogSync'

/**
 * Read-only mirror of the org chart's areas, mandate by mandate. There is no create/update/delete
 * counterpart: the org chart owns this data outright, so the admin screen is a reference view.
 * Ordered newest mandate first, then by the position the org chart gives each area.
 */
export default defineEventHandler(async (event) => {
  await syncAreaCatalog(event)

  const rows = await db.query.areaCatalogEntries.findMany({
    orderBy: [asc(areaCatalogEntries.order)],
  })
  const syncState = await getCatalogSyncState('area')

  const mandates = [...new Map(rows.map((row) => [row.mandateId, row])).values()]
    .sort((a, b) => b.mandateStartDate.localeCompare(a.mandateStartDate))
    .map((row) => ({
      id: row.mandateId,
      startDate: row.mandateStartDate,
      endDate: row.mandateEndDate,
      isCurrent: row.mandateEndDate === null,
      areas: rows
        .filter((entry) => entry.mandateId === row.mandateId)
        .sort((a, b) => a.order - b.order)
        .map((entry) => ({
          id: entry.id,
          selectionKey: entry.selectionKey,
          nameTranslations: entry.nameTranslations,
          order: entry.order,
          lastSyncedAt: entry.lastSyncedAt,
        })),
    }))

  return {
    data: mandates,
    meta: {
      lastSuccessAt: syncState?.lastSuccessAt ?? null,
      lastFailureAt: syncState?.lastFailureAt ?? null,
      lastErrorMessage: syncState?.lastErrorMessage ?? null,
    },
  }
})
