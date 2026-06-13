import { createError } from 'h3'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/cache/externalApiCache'
import { getEventBySlug } from '../../utils/external/events'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../../utils/cache/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const { slug } = validatePublicRouteParams(event, slugRouteParamSchema)

    setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event), 0)

    const { event: matchedEvent, generatedAt } = await getEventBySlug(event, slug)

    if (!matchedEvent) {
      throw createError({
        statusCode: 404,
        message: getPublicApiErrorMessage(event, 'eventNotFound'),
      })
    }

    return {
      data: matchedEvent,
      meta: {
        generatedAt,
      },
    }
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) => {
      const params = event.context.params ?? {}
      const slug = typeof params.slug === 'string' ? params.slug : ''
      return buildPublicRouteCacheKey(event, `evento-slug:${slug}`, { includeLocale: false })
    },
  }
)
