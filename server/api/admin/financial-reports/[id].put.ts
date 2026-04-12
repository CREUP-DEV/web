import { defineEventHandler, readBody, createError } from 'h3'
import { and, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
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
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { throwAdminMutationError } from '../../../utils/adminErrors'
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
    if (validated.updatedAt) {
      const clientUpdatedAt = new Date(validated.updatedAt).getTime()
      const serverUpdatedAt = existingItem.updatedAt
        ? new Date(existingItem.updatedAt).getTime()
        : 0

      if (clientUpdatedAt !== serverUpdatedAt) {
        throw createError({
          statusCode: 409,
          message:
            'El informe fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        })
      }
    }

    if (!getRequiredTranslationValue(validated.translations, 'title')) {
      throw createError({
        statusCode: 400,
        message: 'El título en español es obligatorio',
      })
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

    const item = (await runAdminCrudTransaction(async (tx) => {
      const whereCondition = validated.updatedAt
        ? and(eq(financialReports.id, id), eq(financialReports.updatedAt, existingItem.updatedAt))
        : eq(financialReports.id, id)

      const updatedRows = await tx
        .update(financialReports)
        .set({
          pdfUrl,
          approvedAt: dateOnlyToStorageDate(validated.approvedAt),
          order: validated.order,
          active: validated.active,
        })
        .where(whereCondition)
        .returning({ id: financialReports.id })

      if (updatedRows.length === 0) {
        throw createError({
          statusCode: 409,
          message:
            'El informe fue modificado por otro usuario. Recarga la página para ver los cambios más recientes.',
        })
      }

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
    }, 'No se pudo actualizar el informe económico'))!

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
      item: {
        ...item,
        approvedAt: dateValueToDateOnly(item.approvedAt),
      },
    }
  } catch (e) {
    await cleanupAdminAssetFinalizationsSafely(
      cleanupTargets,
      'admin.financial-reports.update.rollback',
      event
    )
    throwAdminMutationError('admin.financial-reports.update', e, event)
  }
})
