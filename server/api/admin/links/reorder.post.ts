import { defineEventHandler } from 'h3'
import { featuredLinks } from '../../../db/schema'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: featuredLinks,
    idColumn: featuredLinks.id,
    orderColumn: featuredLinks.order,
    invalidate: invalidateHomeDataCache,
    scope: 'admin.links.reorder',
  })
)
