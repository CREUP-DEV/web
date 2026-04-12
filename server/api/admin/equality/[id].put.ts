import { defineEventHandler, readBody, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
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
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updateEqualityDocumentSchema } from '~~/shared/utils/adminSchemas'

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
    if (validated.updatedAt) {
      const clientUpdatedAt = new Date(validated.updatedAt).getTime()
      const serverUpdatedAt = existingItem.updatedAt
        ? new Date(existingItem.updatedAt).getTime()
        : 0

      if (clientUpdatedAt !== serverUpdatedAt) {
        throw createError({
          statusCode: 409,
          message:
            'El documento fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        })
      }
    }

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

    const item = await runAdminCrudTransaction(async (tx) => {
      const whereCondition = validated.updatedAt
        ? and(eq(equalityDocuments.id, id), eq(equalityDocuments.updatedAt, existingItem.updatedAt))
        : eq(equalityDocuments.id, id)

      const updatedRows = await tx
        .update(equalityDocuments)
        .set({
          pdfUrl,
          order: validated.order,
          active: validated.active,
        })
        .where(whereCondition)
        .returning({ id: equalityDocuments.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message:
            'El documento fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        })
      }

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
    }, 'No se pudo actualizar el documento de igualdad')

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

    return { data: item }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.equality.update.rollback',
      event
    )
    throwAdminMutationError('admin.equality.update', e, event)
  }
})
