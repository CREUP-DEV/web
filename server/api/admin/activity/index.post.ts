import { defineEventHandler, readBody } from 'h3'
import { invalidateActivityRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { createActivityEntrySchema, validateBody } from '../../../utils/validation'
import { createActivityEntry } from '../../../services/activityEntryService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(event, createActivityEntrySchema, body)
  const item = await createActivityEntry(validated, event)
  await invalidateActivityRelatedCaches()
  return { data: item }
})
