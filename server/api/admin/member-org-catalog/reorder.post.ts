import { defineEventHandler } from 'h3'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { MEMBER_ORG_SOURCES } from '~~/shared/constants/activity'
import { memberOrgCatalogEntries } from '../../../db/schema'
import { reorderCollection } from '../../../utils/admin/adminReorder'
import { validateQuery } from '../../../utils/validation'

const reorderQuerySchema = z.object({
  source: z.enum(MEMBER_ORG_SOURCES),
})

export default defineEventHandler((event) => {
  const { source } = validateQuery(event, reorderQuerySchema)

  return reorderCollection(event, {
    table: memberOrgCatalogEntries,
    idColumn: memberOrgCatalogEntries.id,
    orderColumn: memberOrgCatalogEntries.order,
    invalidate: () => {},
    scope: 'admin.member-org-catalog.reorder',
    where: and(
      eq(memberOrgCatalogEntries.source, source),
      eq(memberOrgCatalogEntries.active, true)
    ),
  })
})
