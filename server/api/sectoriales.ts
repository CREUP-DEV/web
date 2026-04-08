import { defineEventHandler } from 'h3'
import { getExternalApiCacheOptions, setExternalApiCacheHeaders } from '../utils/externalApiCache'
import { getSectorialesResponse } from '../utils/publicMembers'

export default defineEventHandler(async (event) => {
  const cacheOptions = getExternalApiCacheOptions(event)
  setExternalApiCacheHeaders(event, cacheOptions)

  return getSectorialesResponse(event)
})
