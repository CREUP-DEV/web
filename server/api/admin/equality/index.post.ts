import { defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { equalityDocuments, equalityDocumentTranslations } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import { runAdminCrudTransaction } from '../../../utils/adminCrud'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
} from '../../../utils/localizedContent'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { validateBody } from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createEqualityDocumentSchema } from '~~/shared/utils/adminSchemas'

const PDF_UPLOAD_DIR = 'public/documentos/igualdad'

function getEqualityDocumentSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(createEqualityDocumentSchema, body)
    const pdfUrl = await finalizeAdminDocument({
      storagePath: validated.pdfUrl,
      uploadDir: PDF_UPLOAD_DIR,
      publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
      slug: getEqualityDocumentSlug(validated.translations),
      publish: validated.active,
      fallbackBaseName: 'documento-igualdad',
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.pdfUrl,
      storagePath: pdfUrl,
      allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
    })
    const translationsToCreate = filterTranslationsByContent(
      validated.translations,
      (translation) =>
        translation.title.trim() !== '' ||
        translation.description.trim() !== '' ||
        Boolean(translation.meta?.trim())
    )

    const completeItem = await runAdminCrudTransaction(async (tx) => {
      const [item] = await tx
        .insert(equalityDocuments)
        .values({
          pdfUrl,
          order: validated.order,
          active: validated.active,
        })
        .returning()

      if (!item) {
        return null
      }

      if (translationsToCreate.length > 0) {
        await tx.insert(equalityDocumentTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            description: translation.description.trim(),
            meta: translation.meta?.trim() || null,
            equalityDocumentId: item.id,
          }))
        )
      }

      return tx.query.equalityDocuments.findFirst({
        where: eq(equalityDocuments.id, item.id),
        with: { translations: true },
      })
    }, 'No se pudo crear el documento de igualdad')

    if (validated.pdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
        },
        'admin.equality.create.cleanup',
        event
      )
    }

    return { data: completeItem }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.equality.create.rollback',
      event
    )
    throwAdminMutationError('admin.equality.create', e, event)
  }
})
