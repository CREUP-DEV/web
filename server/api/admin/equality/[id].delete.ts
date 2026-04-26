import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateEqualityDocumentsCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.equalityDocuments.findFirst({
      where: eq(equalityDocuments.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(equalityDocuments).where(eq(equalityDocuments.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.pdfUrl,
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
