import { defineEventHandler, readBody } from 'h3'
import { invalidateAreaReportsCache } from '../../../utils/admin/adminCacheInvalidation'
import { createAreaReportSchema, validateBody } from '../../../utils/validation'
import { createAreaReport } from '../../../utils/admin/crud/area-reports'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(event, createAreaReportSchema, body)
  const item = await createAreaReport(validated, event)
  await invalidateAreaReportsCache()
  return { data: item }
})
