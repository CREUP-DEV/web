import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateMediaOutletSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single media outlet
  if (event.method === 'GET') {
    await requireAuth(event)
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
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateMediaOutletSchema, body)

      await db
        .update(mediaOutlets)
        .set({
          name: validated.name,
          website: validated.website,
          logo: validated.logo,
          order: validated.order,
        })
        .where(eq(mediaOutlets.id, id))

      const item = await db.query.mediaOutlets.findFirst({
        where: eq(mediaOutlets.id, id),
      })

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete media outlet
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(mediaOutlets).where(eq(mediaOutlets.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
