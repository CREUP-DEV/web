/**
 * Member Calendar API endpoint
 * Fetches upcoming events from a member's public Google Calendar
 * by using their email as the Google Calendar ID.
 */

import { defineEventHandler, getQuery } from 'h3'
import {
  normalizeLocaleDefinitions,
  resolveConfiguredLocaleCode,
  resolveLocaleCode,
} from '../../shared/utils/locale'

interface GoogleCalendarEvent {
  id: string
  recurringEventId?: string
  summary?: string
  description?: string
  location?: string
  originalStartTime?: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  start: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
  end: {
    dateTime?: string
    date?: string
    timeZone?: string
  }
}

interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[]
}

interface CalendarEventOutput {
  id: string
  seriesId: string
  title: string
  date: string
  startDate: string
  endDate?: string
  timeSlot: string
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  description?: string
  location?: string
  isMultiDay?: boolean
}

const translations = {
  es: {
    allDay: 'Todo el día',
    day: 'Día',
    of: 'de',
  },
  en: {
    allDay: 'All day',
    day: 'Day',
    of: 'of',
  },
}

function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day))
}

function formatUTCDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = parseUTCDate(startDate)
  const end = parseUTCDate(endDate)
  end.setUTCDate(end.getUTCDate() - 1)

  const current = new Date(start)
  while (current <= end) {
    dates.push(formatUTCDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

// Build a stable identifier per occurrence.
// For recurring events, each occurrence should be treated independently.
function getOccurrenceSeriesId(item: GoogleCalendarEvent): string {
  const originalStart = item.originalStartTime?.dateTime || item.originalStartTime?.date

  if (item.recurringEventId && originalStart) {
    return `${item.recurringEventId}::${originalStart}`
  }

  return item.id
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const runtimeI18n = useRuntimeConfig(event).public.i18n as {
    defaultLocale?: unknown
    locales?: unknown
  }
  const locales = normalizeLocaleDefinitions(runtimeI18n.locales)
  const defaultLocale = resolveConfiguredLocaleCode(runtimeI18n.defaultLocale, locales)
  const locale = resolveLocaleCode(query.locale as string | undefined, locales, defaultLocale)
  const languageTag = locales.find((item) => item.code === locale)?.language ?? 'es-ES'
  const calendarId = query.calendarId as string
  const t = translations[locale as keyof typeof translations] || translations.es

  if (!calendarId) {
    return { events: [] }
  }

  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY

  if (!apiKey) {
    return { events: [] }
  }

  const now = new Date()
  const threeMonthsLater = new Date()
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

  const timeMin = now.toISOString()
  const timeMax = threeMonthsLater.toISOString()

  try {
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
    )
    url.searchParams.set('key', apiKey)
    url.searchParams.set('timeMin', timeMin)
    url.searchParams.set('timeMax', timeMax)
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '50')

    const response = await fetch(url.toString())

    if (!response.ok) {
      console.error(`Calendar API error: ${response.status}`)
      return { events: [] }
    }

    const data: GoogleCalendarResponse = await response.json()
    const events: CalendarEventOutput[] = []

    for (const item of data.items || []) {
      const isAllDay = !item.start.dateTime && !!item.start.date
      const seriesId = getOccurrenceSeriesId(item)

      if (isAllDay && item.start.date && item.end.date) {
        const dateRange = getDateRange(item.start.date, item.end.date)
        const isMultiDay = dateRange.length > 1
        const totalDays = dateRange.length

        for (let i = 0; i < dateRange.length; i++) {
          const dateStr = dateRange[i]!
          const dayLabel = isMultiDay ? ` (${t.day} ${i + 1} ${t.of} ${totalDays})` : ''

          events.push({
            id: `${item.id}_${dateStr}`,
            seriesId,
            title: `${item.summary || 'Sin título'}${dayLabel}`,
            date: dateStr,
            startDate: dateRange[0]!,
            endDate: isMultiDay ? dateRange[dateRange.length - 1] : undefined,
            timeSlot: t.allDay,
            isAllDay: true,
            description: item.description,
            location: item.location,
            isMultiDay,
          })
        }
      } else if (item.start.dateTime && item.end.dateTime) {
        const startDate = new Date(item.start.dateTime)
        const endDate = new Date(item.end.dateTime)

        const dateStr = startDate.toISOString().split('T')[0]!
        const startTime = startDate.toLocaleTimeString(languageTag, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
        const endTime = endDate.toLocaleTimeString(languageTag, {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })

        events.push({
          id: item.id,
          seriesId,
          title: item.summary || 'Sin título',
          date: dateStr,
          startDate: dateStr,
          timeSlot: `${startTime} - ${endTime}`,
          startTime,
          endTime,
          isAllDay: false,
          description: item.description,
          location: item.location,
          isMultiDay: false,
        })
      }
    }

    return { events }
  } catch (error) {
    console.error('Error fetching member calendar:', error)
    return { events: [] }
  }
})
