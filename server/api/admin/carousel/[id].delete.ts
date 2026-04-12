import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/adminCacheInvalidation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import {
  HOME_CAROUSEL_FALLBACK_IMAGE,
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const existingItem = await db.query.carouselItems.findFirst({
    where: eq(carouselItems.id, id),
  })

  if (!existingItem) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  await db.delete(carouselItems).where(eq(carouselItems.id, id))

  await cleanupUnusedAdminAssetSafely(
    {
      storagePath: existingItem.image,
      allowedPublicPathPrefixes: [HOME_CAROUSEL_IMAGE_PUBLIC_PATH],
      protectedPublicPaths: [HOME_CAROUSEL_FALLBACK_IMAGE],
    },
    'admin.carousel.delete.cleanup',
    event
  )

  await invalidateHomeDataCache()
  return { data: { success: true }, success: true }
})
