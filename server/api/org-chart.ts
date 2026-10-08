import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getTeamAreasResponse } from '../utils/public/publicMembers'
import {
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  publicRouteCacheOptions,
} from '../utils/cache/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const cacheOptions = getExternalApiCacheOptions(event)
    setExternalApiCacheHeaders(event, cacheOptions, 0)

    const payload = await getTeamAreasResponse(event)
    return {
      data: payload.areas,
      meta: {
        generatedAt: payload.generatedAt,
      },
    }
  },
  publicRouteCacheOptions(
    'organigrama',
    { includeLocale: false },
    FAST_EXTERNAL_ROUTE_CACHE_OPTIONS
  )
)
