import { defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../utils/cache/externalApiCache'
import { fetchMandateDetail } from '../../../utils/external/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../../utils/core/runtimeConfig'
import { numericIdRouteParamSchema, validatePublicRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions, 0)

  const { id: mandateId } = validatePublicRouteParams(event, numericIdRouteParamSchema)

  return {
    data: await fetchMandateDetail(configuredBaseUrl, mandateId, cacheOptions, event),
  }
})
