import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { featuredLinks, featuredLinkTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createFeaturedLinkSchema, validateBody } from '../../../utils/validation'

// GET - List all featured links
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.featuredLinks.findMany({
      orderBy: asc(featuredLinks.order),
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new featured link
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createFeaturedLinkSchema, body)

      const [item] = await db
        .insert(featuredLinks)
        .values({
          image: validated.image,
          to: validated.to,
          order: validated.order,
          active: validated.active,
        })
        .returning()

      // Insert translations
      if (validated.translations.length > 0) {
        await db.insert(featuredLinkTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            alt: t.alt || null,
            featuredLinkId: item.id,
          }))
        )
      }

      // Fetch the complete item with translations
      const completeItem = await db.query.featuredLinks.findFirst({
        where: eq(featuredLinks.id, item.id),
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
