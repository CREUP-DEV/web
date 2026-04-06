import { defineEventHandler } from 'h3'
import { type GoogleCalendarEvent, transformGoogleCalendarItems } from '../utils/calendarEvents'
import { getRequiredGoogleCalendarApiKey } from '../utils/googleCalendarConfig'
import { logError } from '../utils/logger'
import { assertMemberCalendarIsPublic, normalizeMemberCalendarId } from '../utils/memberCalendar'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { memberCalendarQuerySchema, validateQuery } from '../utils/validation'

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
}

export default defineEventHandler(async (event) => {
  const { calendarId } = validateQuery(event, memberCalendarQuerySchema)
  const { locale, fallbackLocale, languageTag } = getRequestLocaleContext(event)

  if (!calendarId) {
    return { events: [] }
  }

  const normalizedCalendarId = normalizeMemberCalendarId(calendarId)
  await assertMemberCalendarIsPublic(event, normalizedCalendarId)

  const apiKey = getRequiredGoogleCalendarApiKey()

  const now = new Date()
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  try {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(normalizedCalendarId)}/events`
    )
    url.searchParams.set('key', apiKey)
    url.searchParams.set('timeMin', now.toISOString())
    url.searchParams.set('timeMax', threeMonthsLater.toISOString())
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '50')

    const response = await fetch(url.toString())

    if (!response.ok) {
      logError(
        'member-calendar.fetch.response',
        new Error('Google Calendar response error'),
        {
          calendarId: normalizedCalendarId,
          statusCode: response.status,
        },
        event
      )
      return { events: [] }
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
    logError('member-calendar.fetch', error, { calendarId: normalizedCalendarId }, event)
    return { events: [] }
  }
})
