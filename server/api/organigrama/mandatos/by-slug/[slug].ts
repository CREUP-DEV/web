import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../../utils/externalApiCache'
import { getPublicApiErrorMessage } from '../../../../utils/apiErrorMessages'
import { fetchMandatesBySlug, fetchMandateDetail } from '../../../../utils/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../../../utils/runtimeConfig'
import {
  mandateSlugRouteParamSchema,
  validatePublicRouteParams,
} from '../../../../utils/validation'

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  const { slug } = validatePublicRouteParams(event, mandateSlugRouteParamSchema)

  const matches = await fetchMandatesBySlug(configuredBaseUrl, slug, cacheOptions, event)

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      message: getPublicApiErrorMessage(event, 'mandateNotFoundByDate'),
    })
  }

  if (matches.length > 1) {
    return {
      ambiguous: true as const,
      mandates: matches,
    }
  }

  const detail = await fetchMandateDetail(configuredBaseUrl, matches[0]!.id, cacheOptions, event)

  return {
    ambiguous: false as const,
    ...detail,
  }
})
