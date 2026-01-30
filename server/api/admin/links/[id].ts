import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateFeaturedLinkSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single featured link
  if (event.method === 'GET') {
    const item = await db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.id, id),
      with: { translations: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update featured link
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateFeaturedLinkSchema, body)

      // Delete existing translations
      await db
        .delete(featuredLinkTranslations)
        .where(eq(featuredLinkTranslations.featuredLinkId, id))

      // Update the item
      await db
        .update(featuredLinks)
        .set({
          image: validated.image,
          to: validated.to,
          order: validated.order,
          active: validated.active,
        })
        .where(eq(featuredLinks.id, id))

      // Insert new translations
      if (validated.translations.length > 0) {
        await db.insert(featuredLinkTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            alt: t.alt || null,
            featuredLinkId: id,
          }))
        )
      }

      // Fetch the complete item with translations
      const item = await db.query.featuredLinks.findFirst({
        where: eq(featuredLinks.id, id),
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

  // DELETE - Delete featured link
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(featuredLinks).where(eq(featuredLinks.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
