import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { carouselItems, carouselItemTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createCarouselItemSchema, validateBody } from '../../../utils/validation'

// GET - List all carousel items
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.carouselItems.findMany({
      orderBy: asc(carouselItems.order),
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new carousel item
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createCarouselItemSchema, body)

      const [item] = await db
        .insert(carouselItems)
        .values({
          image: validated.image,
          href: validated.href,
          order: validated.order,
          active: validated.active,
        })
        .returning()

      // Insert translations
      if (validated.translations.length > 0) {
        await db.insert(carouselItemTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            buttonText: t.buttonText ?? '',
            alt: t.alt || null,
            carouselItemId: item.id,
          }))
        )
      }

      // Fetch the complete item with translations
      const completeItem = await db.query.carouselItems.findFirst({
        where: eq(carouselItems.id, item.id),
        with: { translations: true },
      })

      return { item: completeItem }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
