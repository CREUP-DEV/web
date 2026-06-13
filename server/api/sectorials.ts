import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getSectorialesResponse } from '../utils/public/publicMembers'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
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
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'sectoriales', { includeLocale: false }),
  }
)
