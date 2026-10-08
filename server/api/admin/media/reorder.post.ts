import { defineEventHandler } from 'h3'
import { mediaOutlets } from '../../../db/schema'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: mediaOutlets,
    idColumn: mediaOutlets.id,
    orderColumn: mediaOutlets.order,
    invalidate: invalidatePressRelatedCaches,
    scope: 'admin.media.reorder',
  })
)
