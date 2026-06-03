import { ADMIN_NOT_FOUND_MESSAGE } from '~~/shared/constants/adminMessages'
import { createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
import { invalidateFinancialReportsCache } from '../adminCacheInvalidation'
import { finalizeAdminDocument } from '../adminDocumentUpload'
import { defineAssetBackedTranslatableCrud } from '../defineAssetBackedTranslatableCrud'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
  getRequiredTranslationValue,
} from '../../locale/localizedContent'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import {
  createFinancialReportSchema,
  updateFinancialReportSchema,
} from '~~/shared/utils/adminSchemas'

const OPTIMISTIC_LOCK_MESSAGE =
  'El informe fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.'

async function refetchNormalized(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: string
) {
  const row = await tx.query.financialReports.findFirst({
    where: eq(financialReports.id, id),
    with: { translations: true },
  })
  return row ? { ...row, approvedAt: dateValueToDateOnly(row.approvedAt) } : row
}

export const financialReportsCrud = defineAssetBackedTranslatableCrud({
  schema: { create: createFinancialReportSchema, update: updateFinancialReportSchema },
  validate: (validated) => {
    if (!getRequiredTranslationValue(validated.translations, 'title')) {
      throw createError({ statusCode: 400, message: 'El título en español es obligatorio' })
    }
  },
  asset: {
    uploadDir: 'public/documentos/informes-economicos',
    publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
    fallbackBaseName: 'informe-economico',
    finalize: finalizeAdminDocument,
    getSource: (validated) => validated.pdfUrl,
    deriveSlug: (validated) => getPreferredTranslationValue(validated.translations, 'title'),
    getPublish: (validated) => validated.active,
  },
  main: {
    table: financialReports,
    idColumn: financialReports.id,
    updatedAtColumn: financialReports.updatedAt,
    buildValues: (validated, { assetPath }) => ({
      pdfUrl: assetPath,
      approvedAt: dateOnlyToStorageDate(validated.approvedAt),
      order: validated.order,
      active: validated.active,
    }),
    loadExisting: async (id) => {
      const existing = await db.query.financialReports.findFirst({
        where: eq(financialReports.id, id),
      })
      return existing ? { updatedAt: existing.updatedAt, asset: existing.pdfUrl } : null
    },
    refetch: refetchNormalized,
  },
  translations: {
    table: financialReportTranslations,
    fkColumn: financialReportTranslations.financialReportId,
    buildRows: (validated, parentId) =>
      filterTranslationsByContent(
        validated.translations,
        (translation) => translation.title.trim() !== ''
      ).map((translation) => ({
        locale: translation.locale,
        title: translation.title.trim(),
        financialReportId: parentId,
      })),
  },
  invalidate: invalidateFinancialReportsCache,
  messages: {
    notFound: ADMIN_NOT_FOUND_MESSAGE,
    optimisticLock: OPTIMISTIC_LOCK_MESSAGE,
    createFailed: 'No se pudo crear el informe económico',
    updateFailed: 'No se pudo actualizar el informe económico',
  },
  scope: { create: 'admin.financial-reports.create', update: 'admin.financial-reports.update' },
})
