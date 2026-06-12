import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets, pressArticles } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidatePressCache } from '../../../utils/admin/adminCacheInvalidation'
import {
  isConstraintBlockedDeletionError,
  throwAdminMutationError,
} from '../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    // Run the linked-article check and the delete in one transaction with the media
    // row locked, so a concurrent article-link can't slip between them. The FK/CHECK
    // constraint is the backstop for a race that still wins: map it to 409, not 500.
    const removedLogo = await db.transaction(async (tx) => {
      const [existingItem] = await tx
        .select({ id: mediaOutlets.id, logo: mediaOutlets.logo })
        .from(mediaOutlets)
        .where(eq(mediaOutlets.id, id))
        .for('update')

      if (!existingItem) {
        throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
      }

      const linkedArticle = await tx.query.pressArticles.findFirst({
        where: eq(pressArticles.mediaOutletId, id),
        columns: { id: true },
      })

      if (linkedArticle) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'mediaDeleteBlocked'),
        })
      }

      try {
        await tx.delete(mediaOutlets).where(eq(mediaOutlets.id, id))
      } catch (deleteError) {
        if (isConstraintBlockedDeletionError(deleteError)) {
          throw createError({
            statusCode: 409,
            message: getAdminApiErrorMessage(event, 'mediaDeleteBlocked'),
          })
        }
        throw deleteError
      }

      return existingItem.logo
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: removedLogo,
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
