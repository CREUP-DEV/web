import { defineEventHandler, readBody, createError } from 'h3'
import { eq, desc } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles, pressArticleTranslations, pressArticleTags } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createPressArticleSchema, validateBody } from '../../../utils/validation'
import { generatePressSlug } from '../../../utils/slug'

// GET - List all press articles (optionally filtered by type)
// POST - Create new press article
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const query = getQuery(event)
    const type = query.type as string | undefined

    const whereClause = type ? eq(pressArticles.type, type) : undefined

    const items = await db.query.pressArticles.findMany({
      where: whereClause,
      orderBy: desc(pressArticles.publishedAt),
      with: {
        translations: true,
        tags: {
          with: {
            tag: { with: { translations: true } },
          },
        },
        mediaOutlet: true,
      },
    })
    return { items }
  }

  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createPressArticleSchema, body)

      // Get the Spanish title for slug generation
      const esTranslation = validated.translations.find((t) => t.locale === 'es')
      if (!esTranslation?.title) {
        throw new Error('El título en español es obligatorio')
      }

      const publishedAt = validated.publishedAt ? new Date(validated.publishedAt) : new Date()
      const slug = await generatePressSlug(esTranslation.title, publishedAt)

      const [item] = await db
        .insert(pressArticles)
        .values({
          type: validated.type,
          slug,
          image: validated.image,
          pdfUrl: validated.pdfUrl || null,
          externalUrl: validated.externalUrl || null,
          mediaOutletId: validated.mediaOutletId || null,
          active: validated.active,
          publishedAt,
        })
        .returning()

      if (!item) {
        throw createError({ statusCode: 500, statusMessage: 'Error al crear el artículo' })
      }

      // Insert translations
      if (validated.translations.length > 0) {
        await db.insert(pressArticleTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            description: t.description || null,
            alt: t.alt || null,
            pressArticleId: item.id,
          }))
        )
      }

      // Insert tags
      if (validated.tagIds && validated.tagIds.length > 0) {
        await db.insert(pressArticleTags).values(
          validated.tagIds.map((tagId) => ({
            pressArticleId: item.id,
            tagId,
          }))
        )
      }

      // Fetch the complete item
      const completeItem = await db.query.pressArticles.findFirst({
        where: eq(pressArticles.id, item.id),
        with: {
          translations: true,
          tags: {
            with: {
              tag: { with: { translations: true } },
            },
          },
          mediaOutlet: true,
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
