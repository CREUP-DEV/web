import { defineEventHandler, createError } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateFinancialReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
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

    await invalidateFinancialReportsCache()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.financial-reports.delete', error, event)
  }
})
