/**
 * Mandate detail API endpoint
 * Proxies mandate-specific org chart data from the external CREUP intranet API.
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../utils/externalApiCache'
import { fetchMandateDetail } from '../../../utils/mandateDetail'

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const mandateId = getRouterParam(event, 'id')
  if (!mandateId || !/^\d+$/.test(mandateId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid mandate ID.',
    })
  }

  return fetchMandateDetail(configuredBaseUrl, Number(mandateId), cacheOptions, event)
})
