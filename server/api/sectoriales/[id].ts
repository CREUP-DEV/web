import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getSectorialById } from '../../utils/publicMembers'
import { idRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)

  const { id } = validateRouteParams(event, idRouteParamSchema)
  const sectorial = await getSectorialById(event, id)

  if (!sectorial) {
    throw createError({ statusCode: 404 })
  }

  return { sectorial }
})
