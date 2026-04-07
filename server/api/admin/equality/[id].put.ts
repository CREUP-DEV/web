import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments, equalityDocumentTranslations } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import {
  type CleanupUnusedAdminAssetOptions,
  cleanupAdminAssetFinalizationsSafely,
  cleanupUnusedAdminAssetSafely,
  trackAdminAssetFinalization,
} from '../../../utils/adminAssetPublication'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
} from '../../../utils/localizedContent'
import {
  idRouteParamSchema,
  updateEqualityDocumentSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const PDF_UPLOAD_DIR = 'public/documentos/igualdad'

function getEqualityDocumentSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.equalityDocuments.findFirst({
      where: eq(equalityDocuments.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateEqualityDocumentSchema, body)
    const previousPdfUrl = existingItem.pdfUrl
    const pdfUrl = await finalizeAdminDocument({
      storagePath: validated.pdfUrl,
      uploadDir: PDF_UPLOAD_DIR,
      publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
      slug: getEqualityDocumentSlug(validated.translations),
      publish: validated.active,
      fallbackBaseName: 'documento-igualdad',
      replaceStoragePath: existingItem.pdfUrl,
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

    const item = await db.transaction(async (tx) => {
      await tx
        .update(equalityDocuments)
        .set({
          pdfUrl,
          order: validated.order,
          active: validated.active,
        })
        .where(eq(equalityDocuments.id, id))

      await tx
        .delete(equalityDocumentTranslations)
        .where(eq(equalityDocumentTranslations.equalityDocumentId, id))

      if (translationsToCreate.length > 0) {
        await tx.insert(equalityDocumentTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            description: translation.description.trim(),
            meta: translation.meta?.trim() || null,
            equalityDocumentId: id,
          }))
        )
      }

      return tx.query.equalityDocuments.findFirst({
        where: eq(equalityDocuments.id, id),
        with: { translations: true },
      })
    })

    if (previousPdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousPdfUrl,
          allowedPublicPathPrefixes: [EQUALITY_DOCUMENTS_PUBLIC_PATH],
        },
        'admin.equality.update.cleanup',
        event
      )
    }

    return { item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.equality.update.rollback',
      event
    )

    if (typeof e === 'object' && e !== null && 'statusCode' in e) {
      throw e
    }

    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
