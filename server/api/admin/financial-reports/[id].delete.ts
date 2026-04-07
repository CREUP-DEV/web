import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/adminAssetPublication'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const existingItem = await db.query.financialReports.findFirst({
    where: eq(financialReports.id, id),
  })

  if (!existingItem) {
    throw createError({ statusCode: 404, message: 'No encontrado' })
  }

  await db.delete(financialReports).where(eq(financialReports.id, id))

  await cleanupUnusedAdminAssetSafely(
    {
      storagePath: existingItem.pdfUrl,
      allowedPublicPathPrefixes: [FINANCIAL_REPORTS_PUBLIC_PATH],
    },
    'admin.financial-reports.delete.cleanup',
    event
  )

  return { success: true }
})
