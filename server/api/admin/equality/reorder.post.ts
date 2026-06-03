import { defineEventHandler } from 'h3'
import { equalityDocuments } from '../../../db/schema'
import { invalidateEqualityDocumentsCache } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: equalityDocuments,
    idColumn: equalityDocuments.id,
    orderColumn: equalityDocuments.order,
    invalidate: invalidateEqualityDocumentsCache,
    scope: 'admin.equality.reorder',
  })
)
