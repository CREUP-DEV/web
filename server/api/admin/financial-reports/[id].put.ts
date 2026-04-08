import { defineEventHandler, readBody, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
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
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { updateFinancialReportSchema } from '~~/shared/utils/adminSchemas'

const PDF_UPLOAD_DIR = 'public/documentos/informes-economicos'

function getFinancialReportSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const existingItem = await db.query.financialReports.findFirst({
      where: eq(financialReports.id, id),
    })

    if (!existingItem) {
      throw createError({ statusCode: 404, message: 'No encontrado' })
    }

    const validated = validateBody(updateFinancialReportSchema, body)
    if (!getRequiredTranslationValue(validated.translations, 'title')) {
      throw new Error('El título en español es obligatorio')
    }
    const previousPdfUrl = existingItem.pdfUrl
    const pdfUrl = await finalizeAdminDocument({
      storagePath: validated.pdfUrl,
      uploadDir: PDF_UPLOAD_DIR,
      publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
      slug: getFinancialReportSlug(validated.translations),
      publish: validated.active,
      fallbackBaseName: 'informe-economico',
      replaceStoragePath: existingItem.pdfUrl,
    })
    trackAdminAssetFinalization(cleanupTargets, {
      sourceStoragePath: validated.pdfUrl,
      storagePath: pdfUrl,
      allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
    })

    const translationsToCreate = filterTranslationsByContent(
      validated.translations,
      (translation) => translation.title.trim() !== ''
    )

    const item = await db.transaction(async (tx) => {
      await tx
        .update(financialReports)
        .set({
          pdfUrl,
          approvedAt: dateOnlyToStorageDate(validated.approvedAt),
          order: validated.order,
          active: validated.active,
        })
        .where(eq(financialReports.id, id))

      await tx
        .delete(financialReportTranslations)
        .where(eq(financialReportTranslations.financialReportId, id))

      if (translationsToCreate.length > 0) {
        await tx.insert(financialReportTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            financialReportId: id,
          }))
        )
      }

      return tx.query.financialReports.findFirst({
        where: eq(financialReports.id, id),
        with: { translations: true },
      })
    })

    if (previousPdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: previousPdfUrl,
          allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
        },
        'admin.financial-reports.update.cleanup',
        event
      )
    }

    return {
      item: item
        ? {
            ...item,
            approvedAt: dateValueToDateOnly(item.approvedAt),
          }
        : null,
    }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.financial-reports.update.rollback',
      event
    )

    if (e && typeof e === 'object' && 'statusCode' in e) {
      throw e
    }

    throw createError({
      statusCode: 400,
      message: e instanceof Error ? e.message : 'Error de validación',
    })
  }
})
