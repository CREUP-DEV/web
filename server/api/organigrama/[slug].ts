import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getTeamMemberBySlug } from '../../utils/publicMembers'
import { slugRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)

  const { slug } = validateRouteParams(event, slugRouteParamSchema)
  const member = await getTeamMemberBySlug(event, slug)

  if (!member) {
    throw createError({ statusCode: 404 })
  }

  return { member }
})
