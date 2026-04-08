import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags, tagTranslations } from '../../../db/schema'
import {
  filterTranslationsByContent,
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { invalidatePressRelatedCaches } from '../../../utils/adminCacheInvalidation'
import { assertTagSlugAvailable } from '../../../utils/tagMutations'
import {
  idRouteParamSchema,
  updateTagSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  // GET - Get single tag
  if (event.method === 'GET') {
    const item = await db.query.tags.findFirst({
      where: eq(tags.id, id),
      with: { translations: true },
    })

    if (!item) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    return { item }
  }

  // PUT - Update tag
  if (event.method === 'PUT') {
    const body = await readBody(event)

    try {
      const validated = validateBody(updateTagSchema, body)
      await assertTagSlugAvailable(validated.slug, id)

      if (!getRequiredTranslationValue(validated.translations, 'name')) {
        throw createError({
          statusCode: 400,
          message: 'El nombre en español es requerido',
        })
      }

      const translationsToUpdate = filterTranslationsByContent(
        validated.translations,
        (translation) => Boolean(translation.name?.trim())
      )

      const item = await db.transaction(async (tx) => {
        await tx.delete(tagTranslations).where(eq(tagTranslations.tagId, id))

        await tx
          .update(tags)
          .set({
            slug: validated.slug,
            order: validated.order,
          })
          .where(eq(tags.id, id))

        if (translationsToUpdate.length > 0) {
          await tx.insert(tagTranslations).values(
            translationsToUpdate.map((translation) => ({
              locale: translation.locale,
              name: translation.name,
              tagId: id,
            }))
          )
        }

        return tx.query.tags.findFirst({
          where: eq(tags.id, id),
          with: { translations: true },
        })
      })

      await invalidatePressRelatedCaches()
      return { item }
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

  // DELETE - Delete tag
  if (event.method === 'DELETE') {
    await db.delete(tags).where(eq(tags.id, id))

    await invalidatePressRelatedCaches()
    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
