import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { newsItems, newsItemTranslations, newsTags } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { updateNewsItemSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single news item
  if (event.method === 'GET') {
    const item = await db.query.newsItems.findFirst({
      where: eq(newsItems.id, id),
      with: {
        translations: true,
        tags: {
          with: {
            tag: { with: { translations: true } },
          },
        },
      },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update news item
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updateNewsItemSchema, body)

      // Delete existing translations and tags
      await db.delete(newsItemTranslations).where(eq(newsItemTranslations.newsItemId, id))
      await db.delete(newsTags).where(eq(newsTags.newsItemId, id))

      // Update the item
      await db
        .update(newsItems)
        .set({
          image: validated.image,
          to: validated.to,
          order: validated.order,
          active: validated.active,
          publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : undefined,
        })
        .where(eq(newsItems.id, id))

      // Insert new translations
      if (validated.translations.length > 0) {
        await db.insert(newsItemTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            alt: t.alt || null,
            newsItemId: id,
          }))
        )
      }

      // Insert new tags
      if (validated.tagIds && validated.tagIds.length > 0) {
        await db.insert(newsTags).values(
          validated.tagIds.map((tagId) => ({
            newsItemId: id,
            tagId,
          }))
        )
      }

      // Fetch the complete item with translations and tags
      const item = await db.query.newsItems.findFirst({
        where: eq(newsItems.id, id),
        with: {
          translations: true,
          tags: {
            with: {
              tag: { with: { translations: true } },
            },
          },
        },
      })

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete news item
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(newsItems).where(eq(newsItems.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
