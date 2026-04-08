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
import { validateBody } from '../../../utils/validation'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'
import { createFinancialReportSchema } from '~~/shared/utils/adminSchemas'

const PDF_UPLOAD_DIR = 'public/documentos/informes-economicos'

function getFinancialReportSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const cleanupTargets: CleanupUnusedAdminAssetOptions[] = []

  try {
    const validated = validateBody(createFinancialReportSchema, body)
    if (!getRequiredTranslationValue(validated.translations, 'title')) {
      throw new Error('El título en español es obligatorio')
    }
    const pdfUrl = await finalizeAdminDocument({
      storagePath: validated.pdfUrl,
      uploadDir: PDF_UPLOAD_DIR,
      publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
      slug: getFinancialReportSlug(validated.translations),
      publish: validated.active,
      fallbackBaseName: 'informe-economico',
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

    const completeItem = await db.transaction(async (tx) => {
      const [item] = await tx
        .insert(financialReports)
        .values({
          pdfUrl,
          approvedAt: dateOnlyToStorageDate(validated.approvedAt),
          order: validated.order,
          active: validated.active,
        })
        .returning()

      if (!item) {
        throw createError({
          statusCode: 500,
          message: 'No se pudo crear el informe económico',
        })
      }

      if (translationsToCreate.length > 0) {
        await tx.insert(financialReportTranslations).values(
          translationsToCreate.map((translation) => ({
            locale: translation.locale,
            title: translation.title.trim(),
            financialReportId: item.id,
          }))
        )
      }

      return tx.query.financialReports.findFirst({
        where: eq(financialReports.id, item.id),
        with: { translations: true },
      })
    })

    if (validated.pdfUrl !== pdfUrl) {
      await cleanupUnusedAdminAssetSafely(
        {
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
        },
        'admin.financial-reports.create.cleanup',
        event
      )
    }

    return {
      item: completeItem
        ? {
            ...completeItem,
            approvedAt: dateValueToDateOnly(completeItem.approvedAt),
          }
        : null,
    }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.financial-reports.create.rollback',
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
