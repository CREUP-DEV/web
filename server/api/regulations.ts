import { fetchNormativa } from '../utils/policy/normativa'
import {
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  publicRouteCacheOptions,
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
  publicRouteCacheOptions('normativa', { includeLocale: false }, FAST_EXTERNAL_ROUTE_CACHE_OPTIONS)
)
