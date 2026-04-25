import { fetchNormativa } from '../utils/normativa'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  setPublicApiCacheHeaders,
} from '../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    setPublicApiCacheHeaders(event)
    return fetchNormativa(event)
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => buildPublicRouteCacheKey(event, 'normativa', { includeLocale: false }),
  }
)
