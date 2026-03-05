import { defineEventHandler, readBody, createError } from 'h3'
import { asc } from 'drizzle-orm'
import { db } from '../../../db'
import { mediaOutlets } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createMediaOutletSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  // GET - List all media outlets
  if (event.method === 'GET') {
    await requireAuth(event)
    const items = await db.query.mediaOutlets.findMany({
      orderBy: asc(mediaOutlets.order),
    })
    return { items }
  }

  // POST - Create new media outlet
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createMediaOutletSchema, body)

      const [item] = await db
        .insert(mediaOutlets)
        .values({
          name: validated.name,
          website: validated.website,
          logo: validated.logo,
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
