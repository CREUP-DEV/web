import { createError, setHeader } from 'h3'
import { type GoogleCalendarEvent, transformGoogleCalendarItems } from '../utils/calendarEvents'
import { getRequiredGoogleCalendarApiKey } from '../utils/googleCalendarConfig'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { assertMemberCalendarIsPublic, normalizeMemberCalendarId } from '../utils/memberCalendar'
import { getRequestLocaleContext } from '../utils/requestLocale'
import {
  buildPublicRouteCacheKey,
  PUBLIC_ROUTE_CACHE_OPTIONS,
  setPublicRouteVaryHeaders,
} from '../utils/publicRouteCache'
import { memberCalendarQuerySchema, validatePublicQuery } from '../utils/validation'

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
}

export default defineCachedEventHandler(
  async (event) => {
    setPublicRouteVaryHeaders(event)
    const { calendarId } = validatePublicQuery(event, memberCalendarQuerySchema)
    const { locale, fallbackLocale, languageTag } = getRequestLocaleContext(event)

    if (!calendarId) {
      return { events: [] }
    }

    const normalizedCalendarId = normalizeMemberCalendarId(calendarId)
    await assertMemberCalendarIsPublic(event, normalizedCalendarId)
    let apiKey: string

    try {
      apiKey = getRequiredGoogleCalendarApiKey()
    } catch (error) {
      logError('member-calendar.config', error, { calendarId: normalizedCalendarId }, event)
      return { events: [] }
    }

    const now = new Date()
    const threeMonthsLaterMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 4,
      0,
      23,
      59,
      59,
      999
    )

    try {
      const url = new URL(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`
      )
      url.searchParams.set('key', apiKey)
      url.searchParams.set('timeMin', now.toISOString())
      url.searchParams.set('timeMax', threeMonthsLaterMonthEnd.toISOString())
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')
      url.searchParams.set('maxResults', '50')

      const response = await fetch(url.toString(), { signal: AbortSignal.timeout(10_000) })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        logError(
          'member-calendar.fetch.response',
          errorData,
          {
            calendarId: normalizedCalendarId,
            statusCode: response.status,
          },
          event
        )
        setHeader(event, 'retry-after', 60)
        throw createError({
          statusCode: 503,
          message: getPublicApiErrorMessage(event, 'googleCalendarUnavailable'),
        })
      }

      const data: GoogleCalendarResponse = await response.json()

      return {
        events: transformGoogleCalendarItems(data.items || [], {
          languageTag,
          locale,
          fallbackLocale,
        }),
      }
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error) {
        throw error
      }

      logError('member-calendar.fetch', error, { calendarId: normalizedCalendarId }, event)
      setHeader(event, 'retry-after', 60)

      throw createError({
        statusCode: 503,
        message: getPublicApiErrorMessage(event, 'googleCalendarUnavailable'),
      })
    }
  },
  {
    ...PUBLIC_ROUTE_CACHE_OPTIONS,
    getKey: (event) =>
      buildPublicRouteCacheKey(event, 'public-member-calendar', {
        queryKeys: ['calendarId'],
      }),
  }
)
