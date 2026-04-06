import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import {
  idRouteParamSchema,
  updateMediaOutletSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const LOGO_UPLOAD_DIR = 'public/prensa/imagenes/medios'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  // GET - Get single media outlet
  if (event.method === 'GET') {
    const item = await db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.id, id),
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update media outlet
  if (event.method === 'PUT') {
    const body = await readBody(event)

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
        await cleanupUnusedAdminAsset({
          storagePath: previousLogo,
          allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
        })
      }

      return { item }
    } catch (e) {
      if (typeof e === 'object' && e !== null && 'statusCode' in e) {
        throw e
      }

      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete media outlet
  if (event.method === 'DELETE') {
    const existingItem = await db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    await db.delete(mediaOutlets).where(eq(mediaOutlets.id, id))

    await cleanupUnusedAdminAsset({
      storagePath: existingItem.logo,
      allowedPublicPathPrefixes: [PRESS_MEDIA_LOGO_PUBLIC_PATH],
    })

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
