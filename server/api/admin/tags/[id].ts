import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags, tagTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateTagSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single tag
  if (event.method === 'GET') {
    const item = await db.query.tags.findFirst({
      where: eq(tags.id, id),
      with: { translations: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update tag
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateTagSchema, body)

      // Delete existing translations
      await db.delete(tagTranslations).where(eq(tagTranslations.tagId, id))

      // Update the item
      await db
        .update(tags)
        .set({
          slug: validated.slug,
          order: validated.order,
        })
        .where(eq(tags.id, id))

      // Insert new translations
      if (validated.translations.length > 0) {
        await db.insert(tagTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            name: t.name,
            tagId: id,
          }))
        )
      }

      // Fetch the complete item with translations
      const item = await db.query.tags.findFirst({
        where: eq(tags.id, id),
        with: { translations: true },
      })

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete tag
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(tags).where(eq(tags.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
