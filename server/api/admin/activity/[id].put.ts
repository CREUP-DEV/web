import { defineEventHandler, readBody } from 'h3'
import { invalidateActivityRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import {
  idRouteParamSchema,
  updateActivityEntrySchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { updateActivityEntry } from '../../../services/activityEntryService'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const validated = validateBody(event, updateActivityEntrySchema, body)
  const item = await updateActivityEntry(id, validated, event)
  await invalidateActivityRelatedCaches()
  return { data: item }
})
