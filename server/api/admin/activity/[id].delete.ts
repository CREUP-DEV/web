import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { activityEntries } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateActivityRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { deleteWithOptimisticLock } from '../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: activityEntries,
      idColumn: activityEntries.id,
      updatedAtColumn: activityEntries.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'activityOptimisticLock'),
      },
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: deletedItem.image,
        allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE],
      },
      'admin.activity.delete.cleanup.image',
      event
    )

    await invalidateActivityRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.activity.delete', error, event)
  }
})
