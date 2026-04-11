import { createError } from 'h3'
import { getPublicApiErrorMessage } from '../../utils/apiErrorMessages'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getEventBySlug } from '../../utils/events'
import { slugRouteParamSchema, validateRouteParams } from '../../utils/validation'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../../utils/publicRouteCache'

export default defineCachedEventHandler(
  async (event) => {
    const { slug } = validateRouteParams(event, slugRouteParamSchema)

    setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event))

    const { event: matchedEvent, generatedAt } = await getEventBySlug(event, slug)

    if (!matchedEvent) {
      throw createError({
        statusCode: 404,
        message: getPublicApiErrorMessage(event, 'eventNotFound'),
      })
    }

    return {
      event: matchedEvent,
      generatedAt,
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) => {
      const params = event.context.params ?? {}
      const slug = typeof params.slug === 'string' ? params.slug : ''
      return buildPublicRouteCacheKey(event, `evento-slug:${slug}`, { includeLocale: false })
    },
  }
)
