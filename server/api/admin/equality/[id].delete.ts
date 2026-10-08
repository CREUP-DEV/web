import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateEqualityDocumentsCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { deleteWithOptimisticLock } from '../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: equalityDocuments,
      idColumn: equalityDocuments.id,
      updatedAtColumn: equalityDocuments.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'equalityOptimisticLock'),
      },
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: deletedItem.pdfUrl,
        allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
      },
      'admin.equality.delete.cleanup',
      event
    )

    await invalidateEqualityDocumentsCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.equality.delete', error, event)
  }
})
