import { defineEventHandler, readBody, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { db } from '../../../db'
import { newsItems, newsItemTranslations, newsTags } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createNewsItemSchema, validateBody } from '../../../utils/validation'

// GET - List all news items
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.newsItems.findMany({
      orderBy: desc(newsItems.publishedAt),
      with: {
        translations: true,
        tags: {
          with: {
            tag: { with: { translations: true } },
          },
        },
      },
    })
    return { items }
  }

  // POST - Create new news item
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createNewsItemSchema, body)

      const [item] = await db
        .insert(newsItems)
        .values({
          image: validated.image,
          to: validated.to,
          order: validated.order,
          active: validated.active,
          publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : new Date(),
        })
        .returning()

      // Insert translations
      if (validated.translations.length > 0) {
        await db.insert(newsItemTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            alt: t.alt || null,
            newsItemId: item.id,
          }))
        )
      }

      // Insert tags
      if (validated.tagIds && validated.tagIds.length > 0) {
        await db.insert(newsTags).values(
          validated.tagIds.map((tagId) => ({
            newsItemId: item.id,
            tagId,
          }))
        )
      }

      // Fetch the complete item with translations and tags
      const completeItem = await db.query.newsItems.findFirst({
        where: eq(newsItems.id, item.id),
        with: {
          translations: true,
          tags: {
            with: {
              tag: { with: { translations: true } },
            },
          },
        },
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
