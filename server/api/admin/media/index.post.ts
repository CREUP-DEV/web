import { defineEventHandler, readBody, createError } from 'h3'
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
import { createMediaOutletSchema, validateBody } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const LOGO_UPLOAD_DIR = 'public/prensa/imagenes/medios'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(createMediaOutletSchema, body)
    const logo = await finalizeAdminImage({
      storagePath: validated.logo,
      uploadDir: LOGO_UPLOAD_DIR,
      publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
      slug: validated.name,
      fallbackBaseName: 'medio',
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.logo,
      storagePath: logo,
      allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
    })

    const [item] = await db
      .insert(mediaOutlets)
      .values({
        name: validated.name,
        website: validated.website,
        logo,
        order: validated.order,
      })
      .returning()

    if (validated.logo !== logo) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.logo,
          allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
        },
        'admin.media.create.cleanup',
        event
      )
    }

    await invalidatePressCache()
    return { item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.media.create.rollback', event)

    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
