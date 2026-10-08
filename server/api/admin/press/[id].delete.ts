import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { deleteWithOptimisticLock } from '../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: pressArticles,
      idColumn: pressArticles.id,
      updatedAtColumn: pressArticles.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'pressArticleOptimisticLock'),
      },
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: deletedItem.image,
        allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
      },
      'admin.press.delete.cleanup.image',
      event
    )

    if (deletedItem.pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: deletedItem.pdfUrl,
          allowedPublicPathPrefixes: [PRESS_DOCUMENT_PUBLIC_PATH],
        },
        'admin.press.delete.cleanup.pdf',
        event
      )
    }

    await invalidatePressRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.press.delete', error, event)
  }
})
