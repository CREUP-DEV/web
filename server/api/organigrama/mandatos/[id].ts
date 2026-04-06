import { defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../utils/externalApiCache'
import { fetchMandateDetail } from '../../../utils/mandateDetail'
import { getRequiredExternalApiBaseUrl } from '../../../utils/runtimeConfig'
import { numericIdRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  const { id: mandateId } = validateRouteParams(event, numericIdRouteParamSchema)

  return fetchMandateDetail(configuredBaseUrl, mandateId, cacheOptions, event)
})
