import { defineEventHandler } from 'h3'
import { db } from '../../../db'
import { financialReports } from '../../../db/schema'
import { cleanupUnusedAdminAssetSafely } from '../../../utils/admin/adminAssetPublication'
import { invalidateFinancialReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { deleteWithOptimisticLock } from '../../../utils/admin/optimisticLock'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    const deletedItem = await deleteWithOptimisticLock(db, {
      table: financialReports,
      idColumn: financialReports.id,
      updatedAtColumn: financialReports.updatedAt,
      id,
      clientUpdatedAt: updatedAt,
      messages: {
        notFound: getAdminApiErrorMessage(event, 'notFound'),
        optimisticLock: getAdminApiErrorMessage(event, 'financialReportOptimisticLock'),
      },
    })

    await cleanupUnusedAdminAssetSafely(
      {
        storagePath: deletedItem.pdfUrl,
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
