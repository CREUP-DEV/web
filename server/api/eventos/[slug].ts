import { createError, defineEventHandler } from 'h3'
import { getPublicApiErrorMessage } from '../../utils/apiErrorMessages'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getEventsPayload } from '../../utils/events'
import { slugRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { slug } = validateRouteParams(event, slugRouteParamSchema)

  setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event))

  const payload = await getEventsPayload(event)
  const matchedEvent = payload.events.find((entry) => entry.slug === slug) ?? null

  if (!matchedEvent) {
    throw createError({
      statusCode: 404,
      message: getPublicApiErrorMessage(event, 'eventNotFound'),
    })
  }

  return {
    event: matchedEvent,
    generatedAt: payload.generatedAt,
  }
})
