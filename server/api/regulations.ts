import { fetchNormativa } from '../utils/policy/normativa'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
} from '../utils/cache/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    const payload = await fetchNormativa(event)
    return {
      data: payload.categories,
      meta: {
        generatedAt: payload.generatedAt,
      },
    }
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'normativa', { includeLocale: false }),
  }
)
