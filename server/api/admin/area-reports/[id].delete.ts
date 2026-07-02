import { defineEventHandler } from 'h3'
import { invalidateAreaReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { deleteAreaReport } from '../../../utils/admin/crud/area-reports'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const result = await deleteAreaReport(id, event)
  await invalidateAreaReportsCache()
  return { data: result }
})
