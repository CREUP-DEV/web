import { defineEventHandler } from 'h3'
import { tags } from '../../../db/schema'
import { invalidateTagsCache } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: tags,
    idColumn: tags.id,
    orderColumn: tags.order,
    invalidate: invalidateTagsCache,
    scope: 'admin.tags.reorder',
  })
)
