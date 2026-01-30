import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { tags, tagTranslations } from '../../../db/schema'
import { requireAuth } from '../../../utils/requireAuth'
import { createTagSchema, validateBody } from '../../../utils/validation'

// GET - List all tags
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.tags.findMany({
      orderBy: asc(tags.order),
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new tag
  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createTagSchema, body)

      // Check if slug already exists
      const existingTag = await db.query.tags.findFirst({
        where: eq(tags.slug, validated.slug),
      })

      if (existingTag) {
        throw createError({
          statusCode: 409,
          message: 'SLUG_EXISTS',
        })
      }

      // Filter translations - only save non-empty ones, Spanish is required
      const spanishTranslation = validated.translations.find((t) => t.locale === 'es')
      if (!spanishTranslation?.name?.trim()) {
        throw createError({
          statusCode: 400,
          message: 'El nombre en español es requerido',
        })
      }

      const translationsToCreate = validated.translations.filter(
        (t) => t.locale === 'es' || (t.name && t.name.trim() !== '')
      )

      const [item] = await db
        .insert(tags)
        .values({
          slug: validated.slug,
          order: validated.order,
        })
        .returning()

      // Insert translations
      if (translationsToCreate.length > 0) {
        await db.insert(tagTranslations).values(
          translationsToCreate.map((t) => ({
            locale: t.locale,
            name: t.name,
            tagId: item.id,
          }))
        )
      }

      // Fetch the complete item with translations
      const completeItem = await db.query.tags.findFirst({
        where: eq(tags.id, item.id),
        with: { translations: true },
      })

      return { item: completeItem }
    } catch (e) {
      if (e && typeof e === 'object' && 'statusCode' in e) {
        throw e
      }
      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
