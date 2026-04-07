import type { H3Event } from 'h3'
import { createError } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from './externalApiCache'
import { logError } from './logger'
import { getRequestLocaleContext } from './requestLocale'
import { getRequiredExternalApiBaseUrl } from './runtimeConfig'
import { externalOrganigramaResponseSchema } from './validation'

const normalizeCalendarId = (value: string) => value.trim().toLowerCase()

const messagesByLocale = {
  en: {
    unavailable: 'Public agenda is temporarily unavailable.',
    unavailableForMember: 'Public agenda not available.',
  },
  es: {
    unavailable: 'La agenda pública no está disponible temporalmente.',
    unavailableForMember: 'La agenda pública no está disponible.',
  },
}

const getMessages = (event: H3Event) => {
  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  return pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es
}

export function normalizeMemberCalendarId(value: string) {
  return normalizeCalendarId(value)
}

export async function assertMemberCalendarIsPublic(event: H3Event, calendarId: string) {
  const normalizedCalendarId = normalizeCalendarId(calendarId)
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const messages = getMessages(event)

  const allowedCalendars = await withExternalApiSWRCache(
    `external-api:organigrama:public-calendar-ids:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/organigrama', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('member-calendar.organigrama.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      const parsedPayload = externalOrganigramaResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError(
          'member-calendar.organigrama.invalid-payload',
          parsedPayload.error,
          {
            endpoint,
          },
          event
        )
        throw createError({
          statusCode: 502,
          statusMessage: messages.unavailable,
        })
      }

      return new Set(
        parsedPayload.data.data.flatMap((area) =>
          area.members.flatMap((member) => {
            if (member.public_agenda !== true || typeof member.email !== 'string') {
              return []
            }

            return [normalizeCalendarId(member.email)]
          })
        )
      )
    },
    getExternalApiCacheOptions(event)
  )

  if (!allowedCalendars.has(normalizedCalendarId)) {
    throw createError({
      statusCode: 404,
      statusMessage: messages.unavailableForMember,
    })
  }
}
