import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { deleteWithOptimisticLock } from '../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { HOME_CAROUSEL_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: carouselItems,
      idColumn: carouselItems.id,
      updatedAtColumn: carouselItems.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'carouselOptimisticLock'),
      },
    })

    if (deletedItem.image) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: deletedItem.image,
          allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
        },
        'admin.carousel.delete.cleanup',
        event
      )
    }

    await invalidateHomeDataCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.carousel.delete', error, event)
  }
})
