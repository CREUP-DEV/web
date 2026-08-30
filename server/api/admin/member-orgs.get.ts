import { defineEventHandler } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../db'
import { memberOrgCatalogEntries } from '../../db/schema'
import { syncMemberOrgCatalog } from '../../utils/admin/catalogSync'

/**
 * Admin organiser dropdown for activities. Backed by the local member-org catalog, auto-synced
 * from the associated-members/sectoriales feeds on every read rather than a direct live
 * passthrough — so an organisation removed/renamed upstream stays selectable for historical
 * activities. Always includes inactive/historical/superseded entries; the client groups them.
 *
 * Response shape is load-bearing: AdminActivityOrganiserPanel.vue builds its option value as
 * `${source}:${id}` and reads denomination/initials/logoLight/logoDark for the preview. `id`
 * here is the catalog row's `selectionKey` (the value frozen into `activityEntries.memberOrgId`),
 * not the catalog row's own internal id.
 */
export default defineEventHandler(async (event) => {
  await syncMemberOrgCatalog(event)

  const rows = await db.query.memberOrgCatalogEntries.findMany({
    orderBy: [asc(memberOrgCatalogEntries.source), asc(memberOrgCatalogEntries.order)],
  })

  return {
    data: rows.map((row) => ({
      source: row.source,
      id: row.selectionKey,
      denomination: row.denomination,
      initials: row.initials,
      logoLight: row.logoLight,
      logoDark: row.logoDark,
      order: row.order,
      // A superseded row (a stale duplicate left behind by an upstream rename) behaves like an
      // inactive/historical entry to dropdown consumers, regardless of its own `active` flag.
      active: row.active && !row.supersededByEntryId,
    })),
    meta: { generatedAt: new Date().toISOString() },
  }
})
