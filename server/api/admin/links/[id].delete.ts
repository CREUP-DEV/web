import { ADMIN_NOT_FOUND_MESSAGE } from '~~/shared/constants/adminMessages'
import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateHomeDataCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: ADMIN_NOT_FOUND_MESSAGE })
    }

    await db.delete(featuredLinks).where(eq(featuredLinks.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.image,
        allowedPublicPathPrefixes: [HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH],
      },
      'admin.links.delete.cleanup',
      event
    )

    await invalidateHomeDataCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.links.delete', error, event)
  }
})
