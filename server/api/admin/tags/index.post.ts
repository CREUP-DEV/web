import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { tags, tagTranslations } from '../../../db/schema'
import {
  filterTranslationsByContent,
  getRequiredTranslationValue,
} from '../../../utils/locale/localizedContent'
import { runAdminCrudTransaction } from '../../../utils/admin/adminCrud'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { assertTagSlugAvailable } from '../../../utils/admin/tagMutations'
import { validateBody } from '../../../utils/validation'
import { createTagSchema } from '~~/shared/utils/adminSchemas'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    const validated = validateBody(event, createTagSchema, body)
    await assertTagSlugAvailable(validated.slug)

    if (!getRequiredTranslationValue(validated.translations, 'name')) {
      throw createError({
        statusCode: 400,
        message: getAdminApiErrorMessage(event, 'requiredNameEs'),
      })
    }

    const translationsToCreate = filterTranslationsByContent(
      validated.translations,
      (translation) => Boolean(translation.name?.trim())
    )

    const completeItem = await runAdminCrudTransaction(async (tx) => {
      const [item] = await tx
        .insert(tags)
        .values({
          slug: validated.slug,
          order: validated.order,
        })
        .returning()

      if (!item) {
        return null
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
    }, 'No se pudo crear la etiqueta')

    await invalidatePressRelatedCaches()
    return { data: completeItem }
  } catch (e) {
    throwAdminMutationError('admin.tags.create', e, event)
  }
})
