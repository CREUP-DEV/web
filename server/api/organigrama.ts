import { getExternalApiCacheOptions, setExternalApiCacheHeaders } from '../utils/externalApiCache'
import { getTeamAreasResponse } from '../utils/publicMembers'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const cacheOptions = getExternalApiCacheOptions(event)
    setExternalApiCacheHeaders(event, cacheOptions, 0)

    return getTeamAreasResponse(event)
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'organigrama', { includeLocale: false }),
  }
)
