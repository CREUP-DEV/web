import { defineEventHandler } from 'h3'
import { mediaOutlets } from '../../../db/schema'
import { invalidatePressCache } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: mediaOutlets,
    idColumn: mediaOutlets.id,
    orderColumn: mediaOutlets.order,
    invalidate: invalidatePressCache,
    scope: 'admin.media.reorder',
  })
)
