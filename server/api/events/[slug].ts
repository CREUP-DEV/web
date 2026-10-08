import { createError } from 'h3'
import { getPublicApiErrorMessage } from '../../utils/locale/apiErrorMessages'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/cache/externalApiCache'
import { getEventBySlug } from '../../utils/external/events'
import { slugRouteParamSchema, validatePublicRouteParams } from '../../utils/validation'
import {
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
  publicRouteCacheOptions,
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
  publicRouteCacheOptions(
    'evento-slug',
    {
      includeLocale: false,
      keyParts: (event) => {
        const params = event.context.params ?? {}
        return [typeof params.slug === 'string' ? params.slug : '']
      },
    },
    FAST_EXTERNAL_ROUTE_CACHE_OPTIONS
  )
)
