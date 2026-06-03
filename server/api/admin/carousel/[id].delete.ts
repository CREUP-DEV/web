import { ADMIN_NOT_FOUND_MESSAGE } from '~~/shared/constants/adminMessages'
import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { HOME_CAROUSEL_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.carouselItems.findFirst({
      where: eq(carouselItems.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: ADMIN_NOT_FOUND_MESSAGE })
    }

    await db.delete(carouselItems).where(eq(carouselItems.id, id))

    if (existingItem.image) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: existingItem.image,
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
