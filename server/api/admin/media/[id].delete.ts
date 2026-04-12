import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/adminAssetPublication'
import { invalidatePressCache } from '../../../utils/adminCacheInvalidation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const existingItem = await db.query.mediaOutlets.findFirst({
    where: eq(mediaOutlets.id, id),
  })

  if (!existingItem) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
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
})
