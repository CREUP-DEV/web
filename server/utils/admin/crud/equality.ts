import { ADMIN_NOT_FOUND_MESSAGE } from '~~/shared/constants/adminMessages'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { equalityDocuments, equalityDocumentTranslations } from '../../../db/schema'
import { invalidateEqualityDocumentsCache } from '../adminCacheInvalidation'
import { finalizeAdminDocument } from '../adminDocumentUpload'
import { defineAssetBackedTranslatableCrud } from '../defineAssetBackedTranslatableCrud'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
} from '../../locale/localizedContent'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import {
  createEqualityDocumentSchema,
  updateEqualityDocumentSchema,
} from '~~/shared/utils/adminSchemas'

const OPTIMISTIC_LOCK_MESSAGE =
  'El documento fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'

export const equalityCrud = defineAssetBackedTranslatableCrud({
  schema: { create: createEqualityDocumentSchema, update: updateEqualityDocumentSchema },
  asset: {
    uploadDir: 'public/documentos/igualdad',
    publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
    fallbackBaseName: 'documento-igualdad',
    finalize: finalizeAdminDocument,
    getSource: (validated) => validated.pdfUrl,
    deriveSlug: (validated) => getPreferredTranslationValue(validated.translations, 'title'),
    getPublish: (validated) => validated.active,
  },
  main: {
    table: equalityDocuments,
    idColumn: equalityDocuments.id,
    updatedAtColumn: equalityDocuments.updatedAt,
    buildValues: (validated, { assetPath }) => ({
      pdfUrl: assetPath,
      order: validated.order,
      active: validated.active,
    }),
    loadExisting: async (id) => {
      const existing = await db.query.equalityDocuments.findFirst({
        where: eq(equalityDocuments.id, id),
      })
      return existing ? { updatedAt: existing.updatedAt, asset: existing.pdfUrl } : null
    },
    refetch: (tx, id) =>
      tx.query.equalityDocuments.findFirst({
        where: eq(equalityDocuments.id, id),
        with: { translations: true },
      }),
  },
  translations: {
    table: equalityDocumentTranslations,
    fkColumn: equalityDocumentTranslations.equalityDocumentId,
    buildRows: (validated, parentId) =>
      filterTranslationsByContent(
        validated.translations,
        (translation) =>
          translation.title.trim() !== '' ||
          translation.description.trim() !== '' ||
          Boolean(translation.meta?.trim())
      ).map((translation) => ({
        locale: translation.locale,
        title: translation.title.trim(),
        description: translation.description.trim(),
        meta: translation.meta?.trim() || null,
        equalityDocumentId: parentId,
      })),
  },
  invalidate: invalidateEqualityDocumentsCache,
  messages: {
    notFound: ADMIN_NOT_FOUND_MESSAGE,
    optimisticLock: OPTIMISTIC_LOCK_MESSAGE,
    createFailed: 'No se pudo crear el documento de igualdad',
    updateFailed: 'No se pudo actualizar el documento de igualdad',
  },
  scope: { create: 'admin.equality.create', update: 'admin.equality.update' },
})
