import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getAssociatedMembersResponse } from '../utils/public/publicMembers'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const cacheOptions = getExternalApiCacheOptions(event)
    setExternalApiCacheHeaders(event, cacheOptions, 0)

    const payload = await getAssociatedMembersResponse(event)
    return {
      data: payload.members,
      meta: {
        generatedAt: payload.generatedAt,
      },
    }
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'members', { includeLocale: false }),
  }
)
