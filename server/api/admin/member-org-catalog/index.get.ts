import { defineEventHandler } from 'h3'
import { asc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { memberOrgCatalogEntries } from '../../../db/schema'
import { getCatalogSyncState, syncMemberOrgCatalog } from '../../../utils/admin/catalogSync'
import { includeInactiveQuerySchema, validateQuery } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { includeInactive } = validateQuery(event, includeInactiveQuerySchema)
  await syncMemberOrgCatalog(event)

  const rows = await db.query.memberOrgCatalogEntries.findMany({
    where: (includeInactive ?? false) ? undefined : eq(memberOrgCatalogEntries.active, true),
    orderBy: [asc(memberOrgCatalogEntries.source), asc(memberOrgCatalogEntries.order)],
  })
  const syncState = await getCatalogSyncState('member-org')

  return {
    data: rows,
    meta: {
      lastSuccessAt: syncState?.lastSuccessAt ?? null,
      lastFailureAt: syncState?.lastFailureAt ?? null,
      lastErrorMessage: syncState?.lastErrorMessage ?? null,
    },
  }
})
