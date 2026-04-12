import { createError, defineEventHandler, readBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { tags, tagTranslations } from '../../../db/schema'
import {
  filterTranslationsByContent,
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { runAdminCrudTransaction } from '../../../utils/adminCrud'
import { invalidatePressRelatedCaches } from '../../../utils/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { assertTagSlugAvailable } from '../../../utils/tagMutations'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { updateTagSchema } from '~~/shared/utils/adminSchemas'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
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

    const item = await runAdminCrudTransaction(async (tx) => {
      const existingItem = await tx.query.tags.findFirst({
        where: eq(tags.id, id),
      })

      if (!existingItem) {
        throw createError({
          statusCode: 404,
          message: 'Etiqueta no encontrada',
        })
      }

      if (validated.updatedAt) {
        const clientUpdatedAt = new Date(validated.updatedAt).getTime()
        const serverUpdatedAt = existingItem.updatedAt
          ? new Date(existingItem.updatedAt).getTime()
          : 0

        if (clientUpdatedAt !== serverUpdatedAt) {
          throw createError({
            statusCode: 409,
            message: 'La etiqueta fue modificada por otro usuario. Recarga la página y reintenta.',
          })
        }
      }

      const updatedRows = await tx
        .update(tags)
        .set({
          slug: validated.slug,
          order: validated.order,
        })
        .where(
          validated.updatedAt
            ? and(eq(tags.id, id), eq(tags.updatedAt, existingItem.updatedAt))
            : eq(tags.id, id)
        )
        .returning({ id: tags.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: 'La etiqueta fue modificada por otro usuario. Recarga la página y reintenta.',
        })
      }

      await tx.delete(tagTranslations).where(eq(tagTranslations.tagId, id))

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
    }, 'No se pudo actualizar la etiqueta')

    await invalidatePressRelatedCaches()
    return { data: item }
  } catch (e) {
    throwAdminMutationError('admin.tags.update', e, event)
  }
})
