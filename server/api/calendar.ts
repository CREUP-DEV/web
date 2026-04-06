import { createError, defineEventHandler } from 'h3'
import { type GoogleCalendarEvent, transformGoogleCalendarItems } from '../utils/calendarEvents'
import {
  getRequiredGoogleCalendarApiKey,
  getRequiredGoogleCalendarId,
} from '../utils/googleCalendarConfig'
import { logError } from '../utils/logger'
import { getRequestLocaleContext } from '../utils/requestLocale'
import { pickLocalizedValue } from '~~/shared/utils/locale'

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
  nextPageToken?: string
}

interface CalendarApiResponse {
  events: ReturnType<typeof transformGoogleCalendarItems>
  configured: boolean
  unavailable?: boolean
}

const messagesByLocale = {
  en: {
    unavailable: 'Google Calendar is temporarily unavailable.',
  },
  es: {
    unavailable: 'Google Calendar no está disponible temporalmente.',
  },
}

export default defineEventHandler(async (event) => {
  const { locale, fallbackLocale, languageTag } = getRequestLocaleContext(event)
  const messages =
    pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es
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
    const threeMonthsAgo = new Date(now)
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    threeMonthsAgo.setHours(0, 0, 0, 0)

    const threeMonthsLater = new Date(now)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

    const baseParams = new URLSearchParams({
      key: apiKey,
      timeMin: threeMonthsAgo.toISOString(),
      timeMax: threeMonthsLater.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '2500',
    })

    const items: GoogleCalendarEvent[] = []
    let nextPageToken: string | undefined

    do {
      const params = new URLSearchParams(baseParams)
      if (nextPageToken) {
        params.set('pageToken', nextPageToken)
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        logError('calendar.fetch.response', errorData, { statusCode: response.status }, event)
        throw createError({
          statusCode: response.status,
          statusMessage: messages.unavailable,
        })
      }

      const data: GoogleCalendarResponse = await response.json()
      items.push(...(data.items || []))
      nextPageToken = data.nextPageToken
    } while (nextPageToken)

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
