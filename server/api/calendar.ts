import { createError, defineEventHandler } from 'h3'
import { type GoogleCalendarEvent, transformGoogleCalendarItems } from '../utils/calendarEvents'
import {
  getRequiredGoogleCalendarApiKey,
  getRequiredGoogleCalendarId,
} from '../utils/googleCalendarConfig'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { getRequestLocaleContext } from '../utils/requestLocale'

const GOOGLE_CALENDAR_MAX_RESULTS = 1000

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
}

interface CalendarApiResponse {
  events: ReturnType<typeof transformGoogleCalendarItems>
  configured: boolean
  unavailable?: boolean
}

export default defineEventHandler(async (event) => {
  const { locale, fallbackLocale, languageTag } = getRequestLocaleContext(event)
  let apiKey: string
  let calendarId: string

  try {
    apiKey = getRequiredGoogleCalendarApiKey()
    calendarId = getRequiredGoogleCalendarId()
  } catch (error) {
    logError('calendar.config', error, undefined, event)

    return {
      events: [],
      configured: false,
    } satisfies CalendarApiResponse
  }

  try {
    const now = new Date()
    const threeMonthsAgoMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1)
    const threeMonthsLaterMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 4,
      0,
      23,
      59,
      59,
      999
    )

    const baseParams = new URLSearchParams({
      key: apiKey,
      timeMin: threeMonthsAgoMonthStart.toISOString(),
      timeMax: threeMonthsLaterMonthEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: String(GOOGLE_CALENDAR_MAX_RESULTS),
    })
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${baseParams}`
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      logError('calendar.fetch.response', errorData, { statusCode: response.status }, event)
      throw createError({
        statusCode: response.status,
        message: getPublicApiErrorMessage(event, 'googleCalendarUnavailable'),
      })
    }

    const data: GoogleCalendarResponse = await response.json()
    const items = data.items || []

    return {
      events: transformGoogleCalendarItems(items, {
        languageTag,
        locale,
        fallbackLocale,
      }),
      configured: true,
    } satisfies CalendarApiResponse
  } catch (error) {
    logError('calendar.fetch', error, undefined, event)

    return {
      events: [],
      configured: true,
      unavailable: true,
    } satisfies CalendarApiResponse
  }
})
