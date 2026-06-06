import { createError, defineEventHandler, readBody } from 'h3'
import { and, eq } from 'drizzle-orm'
import { tags, tagTranslations } from '../../../db/schema'
import {
  filterTranslationsByContent,
  getRequiredTranslationValue,
} from '../../../utils/locale/localizedContent'
import {
  assertOptimisticLock,
  buildOptimisticLockCondition,
} from '../../../utils/admin/optimisticLock'
import { runAdminCrudTransaction } from '../../../utils/admin/adminCrud'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { assertTagSlugAvailable } from '../../../utils/admin/tagMutations'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { updateTagSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)

  try {
    const validated = validateBody(event, updateTagSchema, body)
    await assertTagSlugAvailable(validated.slug, id)

    if (!getRequiredTranslationValue(validated.translations, 'name')) {
      throw createError({
        statusCode: 400,
        message: getAdminApiErrorMessage(event, 'requiredNameEs'),
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
          message: getAdminApiErrorMessage(event, 'tagNotFound'),
        })
      }

      assertOptimisticLock(
        validated.updatedAt,
        existingItem.updatedAt,
        getAdminApiErrorMessage(event, 'tagOptimisticLock')
      )

      const updatedRows = await tx
        .update(tags)
        .set({
          slug: validated.slug,
          order: validated.order,
        })
        .where(
          validated.updatedAt
            ? and(
                eq(tags.id, id),
                buildOptimisticLockCondition(tags.updatedAt, validated.updatedAt)
              )
            : eq(tags.id, id)
        )
        .returning({ id: tags.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message: getAdminApiErrorMessage(event, 'tagOptimisticLock'),
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
