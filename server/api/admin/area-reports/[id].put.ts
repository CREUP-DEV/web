import { defineEventHandler, readBody } from 'h3'
import { invalidateAreaReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import {
  idRouteParamSchema,
  updateAreaReportSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { updateAreaReport } from '../../../utils/admin/crud/area-reports'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const validated = validateBody(event, updateAreaReportSchema, body)
  const item = await updateAreaReport(id, validated, event)
  await invalidateAreaReportsCache()
  return { data: item }
})
