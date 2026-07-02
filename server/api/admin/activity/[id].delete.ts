import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { activityEntries } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateActivityRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.activityEntries.findFirst({
      where: eq(activityEntries.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: getAdminApiErrorMessage(event, 'notFound') })
    }

    await db.delete(activityEntries).where(eq(activityEntries.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.image,
        allowedPublicPathPrefixes: [ACTIVITY_IMAGE_PUBLIC_BASE],
      },
      'admin.activity.delete.cleanup.image',
      event
    )

    await invalidateActivityRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.activity.delete', error, event)
  }
})
