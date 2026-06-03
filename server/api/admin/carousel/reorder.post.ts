import { defineEventHandler } from 'h3'
import { carouselItems } from '../../../db/schema'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { reorderCollection } from '../../../utils/admin/adminReorder'

export default defineEventHandler((event) =>
  reorderCollection(event, {
    table: carouselItems,
    idColumn: carouselItems.id,
    orderColumn: carouselItems.order,
    invalidate: invalidateHomeDataCache,
    scope: 'admin.carousel.reorder',
  })
)
