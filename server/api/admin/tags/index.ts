import { defineEventHandler, readBody, createError } from 'h3'
import { eq, asc } from 'drizzle-orm'
import { db } from '../../../db'
import { tags, tagTranslations } from '../../../db/schema'
import {
  filterTranslationsByContent,
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { invalidatePressRelatedCaches } from '../../../utils/adminCacheInvalidation'
import { assertTagSlugAvailable } from '../../../utils/tagMutations'
import { validateBody } from '../../../utils/validation'
import { createTagSchema } from '~~/shared/utils/adminSchemas'

// GET - List all tags
export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    const items = await db.query.tags.findMany({
      orderBy: [asc(tags.order), asc(tags.id)],
      with: { translations: true },
    })
    return { items }
  }

  // POST - Create new tag
  if (event.method === 'POST') {
    const body = await readBody(event)

    try {
      const validated = validateBody(createTagSchema, body)
      await assertTagSlugAvailable(validated.slug)

      if (!getRequiredTranslationValue(validated.translations, 'name')) {
        throw createError({
          statusCode: 400,
          message: 'El nombre en español es requerido',
        })
      }

      const translationsToCreate = filterTranslationsByContent(
        validated.translations,
        (translation) => Boolean(translation.name?.trim())
      )

      const completeItem = await db.transaction(async (tx) => {
        const [item] = await tx
          .insert(tags)
          .values({
            slug: validated.slug,
            order: validated.order,
          })
          .returning()

        if (!item) {
          throw createError({
            statusCode: 500,
            message: 'No se pudo crear la etiqueta',
          })
        }

        if (translationsToCreate.length > 0) {
          await tx.insert(tagTranslations).values(
            translationsToCreate.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              tagId: item.id,
            }))
          )
        }

        return tx.query.tags.findFirst({
          where: eq(tags.id, item.id),
          with: { translations: true },
        })
      })

      await invalidatePressRelatedCaches()
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
