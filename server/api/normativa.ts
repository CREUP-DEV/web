import { fetchNormativa } from '../utils/normativa'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'

export default defineCachedEventHandler(async (event) => fetchNormativa(event), {
  ...PUBLIC_ROUTE_CACHE_OPTIONS,
  getKey: (event) => buildPublicRouteCacheKey(event, 'normativa', { includeLocale: false }),
})
