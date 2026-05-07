import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsletters } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateNewsletterArchiveCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import {
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingItem = await db.query.newsletters.findFirst({
      where: eq(newsletters.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(newsletters).where(eq(newsletters.id, id))

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.coverImage,
        allowedPublicPathPrefixes: [NEWSLETTER_COVER_IMAGE_PUBLIC_PATH],
      },
      'admin.newsletter.delete.cleanup.cover',
      event
    )

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: existingItem.pdfUrl,
        allowedPublicPathPrefixes: [NEWSLETTER_DOCUMENT_PUBLIC_PATH],
      },
      'admin.newsletter.delete.cleanup.pdf',
      event
    )

    await invalidateNewsletterArchiveCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.newsletter.delete', error, event)
  }
})
