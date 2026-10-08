import { defineEventHandler } from 'h3'
import { invalidateAreaReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'
import { deleteAreaReport } from '../../../utils/admin/crud/area-reports'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)
  const result = await deleteAreaReport(id, updatedAt, event)
  await invalidateAreaReportsCache()
  return { data: result }
})
