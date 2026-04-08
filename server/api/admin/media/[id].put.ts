import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { invalidatePressCache } from '../../../utils/adminCacheInvalidation'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updateMediaOutletSchema } from '~~/shared/utils/adminSchemas'

const LOGO_UPLOAD_DIR = 'public/prensa/imagenes/medios'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateMediaOutletSchema, body)
    const previousLogo = existingItem.logo
    const logo = await finalizeAdminImage({
      storagePath: validated.logo,
      uploadDir: LOGO_UPLOAD_DIR,
      publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
      slug: validated.name,
      fallbackBaseName: 'medio',
      replaceStoragePath: existingItem.logo,
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.logo,
      storagePath: logo,
      allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
    })

    await db
      .update(mediaOutlets)
      .set({
        name: validated.name,
        website: validated.website,
        logo,
        order: validated.order,
      })
      .where(eq(mediaOutlets.id, id))

    const item = await db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.id, id),
    })

    if (previousLogo !== logo) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousLogo,
          allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
        },
        'admin.media.update.cleanup',
        event
      )
    }

    await invalidatePressCache()
    return { item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.media.update.rollback', event)

    if (typeof e === 'object' && e !== null && 'statusCode' in e) {
      throw e
    }

    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
