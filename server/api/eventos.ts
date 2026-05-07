import { z } from 'zod'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../utils/cache/externalApiCache'
import { getEventsPayload } from '../utils/external/events'
import {
  buildPublicRouteCacheKey,
  FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
} from '../utils/cache/publicRouteCache'
import {
  publicPaginationQuerySchema,
  toOptionalSingleStringSchema,
  validatePublicQuery,
} from '../utils/validation'

const eventsListQuerySchema = publicPaginationQuerySchema.extend({
  type: toOptionalSingleStringSchema(z.string().trim().min(1).max(100)),
  types: toOptionalSingleStringSchema(z.string().trim().max(500)),
})

export default defineCachedEventHandler(
  async (event) => {
    const { limit, offset, type, types } = validatePublicQuery(event, eventsListQuerySchema)
    const normalizedLimit = limit ?? 12
    const normalizedOffset = offset ?? 0
    setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event), 0)

    const payload = await getEventsPayload(event)

    const typesList = types
      ? types
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
    const normalizedType = type?.trim() || null

    const allEventTypes = Array.from(
      new Set(
        payload.events
          .map((entry) => entry.type)
          .filter((eventType): eventType is string => Boolean(eventType))
      )
    ).sort((a, b) => a.localeCompare(b))

    const filteredEvents =
      typesList.length > 0
        ? payload.events.filter((entry) => entry.type && typesList.includes(entry.type))
        : normalizedType
          ? payload.events.filter((entry) => entry.type === normalizedType)
          : payload.events

    return {
      data: filteredEvents.slice(normalizedOffset, normalizedOffset + normalizedLimit),
      meta: {
        total: filteredEvents.length,
        eventTypes: allEventTypes,
        generatedAt: payload.generatedAt,
      },
    }
  },
  {
    ...FAST_EXTERNAL_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'eventos', {
        includeLocale: false,
        queryKeys: ['type', 'types', 'limit', 'offset'],
      }),
  }
)
