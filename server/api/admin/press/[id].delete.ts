import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { PRESS_DOCUMENT_PUBLIC_PATH, PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(pressArticles).where(eq(pressArticles.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.image,
        allowedPublicPathPrefixes: [PRESS_IMAGE_PUBLIC_BASE],
      },
      'admin.press.delete.cleanup.image',
      event
    )

    if (existingItem.pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: existingItem.pdfUrl,
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
