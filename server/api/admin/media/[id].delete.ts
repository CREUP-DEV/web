import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets, pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidatePressCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const linkedArticle = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.mediaOutletId, id),
      columns: { id: true },
    })

    if (linkedArticle) {
      throw createError({
        statusCode: 409,
        message:
          'No se puede eliminar este medio porque está asignado a una o más apariciones en los medios.',
      })
    }

    await db.delete(mediaOutlets).where(eq(mediaOutlets.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.logo,
        allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
      },
      'admin.media.delete.cleanup',
      event
    )

    await invalidatePressCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.media.delete', error, event)
  }
})
