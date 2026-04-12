import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
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
    }, 'No se pudo actualizar la etiqueta')

    await invalidatePressRelatedCaches()
    return { data: item }
  } catch (e) {
    throwAdminMutationError('admin.tags.update', e, event)
  }
})
