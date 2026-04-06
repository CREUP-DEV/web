import { createError, defineEventHandler } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../utils/externalApiCache'
import { getEventsPayload } from '../../utils/events'
import { getRequestLocaleContext } from '../../utils/requestLocale'
import { slugRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { slug } = validateRouteParams(event, slugRouteParamSchema)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  const messages = pickLocalizedValue(
    {
      en: { notFound: 'Event not found.' },
      es: { notFound: 'Evento no encontrado.' },
    },
    locale,
    fallbackLocale
  ) ?? { notFound: 'Evento no encontrado.' }

  setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event))

  const payload = await getEventsPayload(event)
  const matchedEvent = payload.events.find((entry) => entry.slug === slug) ?? null

  if (!matchedEvent) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.notFound,
    })
  }

  return {
    event: matchedEvent,
    generatedAt: payload.generatedAt,
  }
})
