import { defineEventHandler, readBody } from 'h3'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import {
  idRouteParamSchema,
  updatePressArticleSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'
import { updatePressArticle } from '../../../services/pressArticleService'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)
  const validated = validateBody(event, updatePressArticleSchema, body)
  const item = await updatePressArticle(id, validated, event)
  await invalidatePressRelatedCaches()
  return { data: item }
})
