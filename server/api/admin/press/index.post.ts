import { defineEventHandler, readBody } from 'h3'
import { createPressArticleSchema, validateBody } from '../../../utils/validation'
import { createPressArticle } from '../../../services/pressArticleService'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(createPressArticleSchema, body)
  const item = await createPressArticle(validated, event)
  return { item }
})
