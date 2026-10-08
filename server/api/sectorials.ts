import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getSectorialesResponse } from '../utils/public/publicMembers'
import {
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  publicRouteCacheOptions,
} from '../utils/cache/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const cacheOptions = getExternalApiCacheOptions(event)
    setExternalApiCacheHeaders(event, cacheOptions, 0)

    const payload = await getSectorialesResponse(event)
    return {
      data: payload.sectoriales,
      meta: {
        generatedAt: payload.generatedAt,
      },
    }
  },
  publicRouteCacheOptions(
    'sectoriales',
    { includeLocale: false },
    FAST_EXTERNAL_ROUTE_CACHE_OPTIONS
  )
)
