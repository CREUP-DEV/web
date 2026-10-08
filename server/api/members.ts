import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getAssociatedMembersResponse } from '../utils/public/publicMembers'
import {
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  publicRouteCacheOptions,
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
  publicRouteCacheOptions('members', { includeLocale: false }, FAST_EXTERNAL_ROUTE_CACHE_OPTIONS)
)
