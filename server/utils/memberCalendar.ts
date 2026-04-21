import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getPublicApiErrorMessage } from './apiErrorMessages'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from './externalApiCache'
import { logError } from './logger'
import { getRequiredExternalApiBaseUrl } from './runtimeConfig'
import { externalOrganigramaResponseSchema } from './validation'

const normalizeCalendarId = (value: string) => value.trim().toLowerCase()

export function normalizeMemberCalendarId(value: string) {
  return normalizeCalendarId(value)
}

export async function assertMemberCalendarIsPublic(event: H3Event, calendarId: string) {
  const normalizedCalendarId = normalizeCalendarId(calendarId)
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const unavailableMessage = getPublicApiErrorMessage(event, 'publicAgendaUnavailable')
  const unavailableForMemberMessage = getPublicApiErrorMessage(event, 'publicAgendaNotAvailable')

  const allowedCalendars = await withExternalApiSWRCache(
    `external-api:organigrama:public-calendar-ids:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/organigrama', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('member-calendar.organigrama.fetch', error, { endpoint }, event)
        return null
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
        return null
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

  if (allowedCalendars === null) {
    logError(
      'member-calendar.organigrama.unavailable',
      new Error(unavailableMessage),
      { calendarId: normalizedCalendarId },
      event
    )
    return
  }

  if (!allowedCalendars.has(normalizedCalendarId)) {
    throw createError({
      statusCode: 404,
      message: unavailableForMemberMessage,
    })
  }
}
