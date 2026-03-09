import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { pressArticles, pressArticleTranslations, pressArticleTags } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { hasMeaningfulRichTextHtml } from '../../../utils/pressTranslation'
import { updatePressArticleSchema, validateBody } from '../../../utils/validation'
import { generatePressSlug } from '../../../utils/slug'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'ID requerido' })
  }

  // GET - Get single press article
  if (event.method === 'GET') {
    const item = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.id, id),
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

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update press article
  if (event.method === 'PUT') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(updatePressArticleSchema, body)

      // Get the Spanish title for slug regeneration
      const esTranslation = validated.translations.find((t) => t.locale === 'es')
      if (!esTranslation?.title) {
        throw new Error('El título en español es obligatorio')
      }

      const publishedAt = validated.publishedAt ? new Date(validated.publishedAt) : undefined
      const slug = await generatePressSlug(esTranslation.title, publishedAt ?? new Date(), id)

      // Delete existing translations and tags
      await db
        .delete(pressArticleTranslations)
        .where(eq(pressArticleTranslations.pressArticleId, id))
      await db.delete(pressArticleTags).where(eq(pressArticleTags.pressArticleId, id))

      // Update the article
      await db
        .update(pressArticles)
        .set({
          type: validated.type,
          slug,
          image: validated.image,
          pdfUrl: validated.pdfUrl || null,
          externalUrl: validated.externalUrl || null,
          mediaOutletId: validated.mediaOutletId || null,
          active: validated.active,
          publishedAt,
        })
        .where(eq(pressArticles.id, id))

      // Insert new translations
      if (validated.translations.length > 0) {
        await db.insert(pressArticleTranslations).values(
          validated.translations.map((t) => ({
            locale: t.locale,
            title: t.title,
            description: t.description || null,
            contentHtml:
              validated.type === 'media_appearance'
                ? null
                : hasMeaningfulRichTextHtml(t.contentHtml)
                  ? t.contentHtml!.trim()
                  : null,
            alt: t.alt || null,
            pressArticleId: id,
          }))
        )
      }

      // Insert new tags
      if (validated.tagIds && validated.tagIds.length > 0) {
        await db.insert(pressArticleTags).values(
          validated.tagIds.map((tagId) => ({
            pressArticleId: id,
            tagId,
          }))
        )
      }

      // Fetch the complete item
      const item = await db.query.pressArticles.findFirst({
        where: eq(pressArticles.id, id),
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

      return { item }
    } catch (e) {
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  // DELETE - Delete press article
  if (event.method === 'DELETE') {
    await requireAuth(event)

    await db.delete(pressArticles).where(eq(pressArticles.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
