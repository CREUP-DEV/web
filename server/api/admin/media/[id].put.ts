import { defineEventHandler, readBody, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/admin/adminImageUpload'
import { invalidatePressCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/admin/adminAssetPublication'
import {
  assertOptimisticLock,
  buildOptimisticLockCondition,
} from '../../../utils/admin/optimisticLock'
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
    assertOptimisticLock(
      validated.updatedAt,
      existingItem.updatedAt,
      'El medio fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'
    )

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

    const whereCondition = validated.updatedAt
      ? and(
          eq(mediaOutlets.id, id),
          buildOptimisticLockCondition(mediaOutlets.updatedAt, validated.updatedAt)
        )
      : eq(mediaOutlets.id, id)

    const updatedRows = await db
      .update(mediaOutlets)
      .set({
        name: validated.name,
        website: validated.website,
        logo,
        order: validated.order,
      })
      .where(whereCondition)
      .returning({ id: mediaOutlets.id })

    if (updatedRows.length === 0) {
      throw createError({
        statusCode: 409,
        message:
          'El medio fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
      })
    }

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
    return { data: item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(cleanupTargets, 'admin.media.update.rollback', event)
    throwAdminMutationError('admin.media.update', e, event)
  }
})
