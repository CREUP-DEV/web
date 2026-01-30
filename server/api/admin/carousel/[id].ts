import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateCarouselItemSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single carousel item
  if (event.method === 'GET') {
    const item = await db.query.carouselItems.findFirst({
      where: eq(carouselItems.id, id),
      with: { translations: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update carousel item
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateCarouselItemSchema, body)

      // Delete existing translations
      await db
        .delete(carouselItemTranslations)
        .where(eq(carouselItemTranslations.carouselItemId, id))

      // Update the item
      await db
        .update(carouselItems)
        .set({
          image: validated.image,
          href: validated.href,
          order: validated.order,
          active: validated.active,
        })
        .where(eq(carouselItems.id, id))

      // Insert new translations
      if (validated.translations.length > 0) {
        await db.insert(carouselItemTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            buttonText: t.buttonText ?? '',
            alt: t.alt || null,
            carouselItemId: id,
          }))
        )
      }

      // Fetch the complete item with translations
      const item = await db.query.carouselItems.findFirst({
        where: eq(carouselItems.id, id),
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

  // DELETE - Delete carousel item
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(carouselItems).where(eq(carouselItems.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
