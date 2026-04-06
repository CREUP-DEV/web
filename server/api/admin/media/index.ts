import { defineEventHandler, readBody, createError } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { finalizeAdminImage } from '../../../utils/adminImageUpload'
import { createMediaOutletSchema, validateBody } from '../../../utils/validation'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const LOGO_UPLOAD_DIR = 'public/prensa/imagenes/medios'

export default defineEventHandler(async (event) => {
  // GET - List all media outlets
  if (event.method === 'GET') {
    const items = await db.query.mediaOutlets.findMany({
      orderBy: asc(mediaOutlets.order),
    })
    return { items }
  }

  // POST - Create new media outlet
  if (event.method === 'POST') {
    const body = await readBody(event)

    try {
      const validated = validateBody(createMediaOutletSchema, body)
      const logo = await finalizeAdminImage({
        storagePath: validated.logo,
        uploadDir: LOGO_UPLOAD_DIR,
        publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
        slug: validated.name,
        fallbackBaseName: 'medio',
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

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
