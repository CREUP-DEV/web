import { defineEventHandler, readBody, createError } from 'h3'
import { desc, eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports, financialReportTranslations } from '../../../db/schema'
import { finalizeAdminDocument } from '../../../utils/adminDocumentUpload'
import { cleanupUnusedAdminAsset } from '../../../utils/adminAssetPublication'
import {
  filterTranslationsByContent,
  getPreferredTranslationValue,
  getRequiredTranslationValue,
} from '../../../utils/localizedContent'
import { createFinancialReportSchema, validateBody } from '../../../utils/validation'
import { dateOnlyToStorageDate, dateValueToDateOnly } from '~~/shared/utils/date'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const PDF_UPLOAD_DIR = 'public/documentos/informes-economicos'

function getFinancialReportSlug(translations: Array<{ locale: string; title: string }>) {
  return getPreferredTranslationValue(translations, 'title')
}

export default defineEventHandler(async (event) => {
  // GET - List all financial reports (admin)
  if (event.method === 'GET') {
    const items = await db.query.financialReports.findMany({
      orderBy: desc(financialReports.approvedAt),
      with: {
        translations: true,
      },
    })

    return {
      items: items.map((item) => ({
        ...item,
        approvedAt: dateValueToDateOnly(item.approvedAt),
      })),
    }
  }

  // POST - Create new financial report
  if (event.method === 'POST') {
    const body = await readBody(event)

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
          with: {
            translations: true,
          },
        })
      })

      if (validated.pdfUrl !== pdfUrl) {
        await cleanupUnusedAdminAsset({
          storagePath: validated.pdfUrl,
          allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
        })
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
      if (e && typeof e === 'object' && 'statusCode' in e) {
        throw e
      }

      throw createError({
        statusCode: 400,
        message: e instanceof Error ? e.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
