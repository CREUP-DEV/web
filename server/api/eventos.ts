import { z } from 'zod'
import { getExternalApiCacheOptions, setExternalApiCacheHeaders } from '../utils/externalApiCache'
import { getEventsPayload } from '../utils/events'
import { buildPublicRouteCacheKey, PUBLIC_ROUTE_CACHE_OPTIONS } from '../utils/publicRouteCache'
import {
  publicPaginationQuerySchema,
  toOptionalSingleStringSchema,
  validatePublicQuery,
} from '../utils/validation'

const eventsListQuerySchema = publicPaginationQuerySchema.extend({
  type: toOptionalSingleStringSchema(z.string().trim().min(1).max(100)),
})

export default defineCachedEventHandler(
  async (event) => {
    const { limit, offset, type } = validatePublicQuery(event, eventsListQuerySchema)
    const normalizedLimit = limit ?? 12
    const normalizedOffset = offset ?? 0
    setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event))

    const payload = await getEventsPayload(event)
    const normalizedType = type?.trim() || null

    const allEventTypes = Array.from(
      new Set(
        payload.events
          .map((entry) => entry.type)
          .filter((eventType): eventType is string => Boolean(eventType))
      )
    ).sort((a, b) => a.localeCompare(b))

    const filteredEvents = normalizedType
      ? payload.events.filter((entry) => entry.type === normalizedType)
      : payload.events

    return {
      events: filteredEvents.slice(normalizedOffset, normalizedOffset + normalizedLimit),
      total: filteredEvents.length,
      eventTypes: allEventTypes,
      generatedAt: payload.generatedAt,
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'eventos', {
        includeLocale: false,
        queryKeys: ['type', 'limit', 'offset'],
      }),
  }
)
