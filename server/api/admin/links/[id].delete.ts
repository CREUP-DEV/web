import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { featuredLinks } from '../../../db/schema'
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
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: featuredLinks,
      idColumn: featuredLinks.id,
      updatedAtColumn: featuredLinks.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'linkOptimisticLock'),
      },
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: deletedItem.image,
        allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
      },
      'admin.links.delete.cleanup',
      event
    )

    await invalidateHomeDataCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.links.delete', error, event)
  }
})
