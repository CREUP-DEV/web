import { defineEventHandler, readBody } from 'h3'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { createPressArticleSchema, validateBody } from '../../../utils/validation'
import { createPressArticle } from '../../../services/pressArticleService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(event, createPressArticleSchema, body)
  const item = await createPressArticle(validated, event)
  await invalidatePressRelatedCaches()
  return { data: item }
})
