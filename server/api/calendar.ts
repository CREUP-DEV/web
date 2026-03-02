/**
 * Google Calendar API endpoint
 * Fetches events from a public Google Calendar
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Google Calendar API" in APIs & Services > Library
 * 4. Go to APIs & Services > Credentials
 * 5. Create an API Key (restrict it to Google Calendar API for security)
 * 6. Make sure your Google Calendar is public or shared appropriately
 * 7. Get your Calendar ID:
 *    - In Google Calendar settings > "Integrate calendar" > Calendar ID
 *    - For public calendars it looks like: example@group.calendar.google.com
 * 8. Add these to your .env file:
 *    GOOGLE_CALENDAR_API_KEY=your_api_key_here
 *    GOOGLE_CALENDAR_ID=your_calendar_id_here
 */

import { defineEventHandler, getQuery, createError } from 'h3'

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
  nextPageToken?: string
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

// Translations for calendar event labels
const translations = {
  es: {
    allDay: 'Todo el día',
    day: 'Día',
    of: 'de',
    from: 'Desde',
    until: 'Hasta',
  },
  en: {
    allDay: 'All day',
    day: 'Day',
    of: 'of',
    from: 'From',
    until: 'Until',
  },
}

// Helper to parse date string to UTC Date (avoiding timezone issues)
function parseUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day))
}

// Helper to format UTC date to YYYY-MM-DD string
function formatUTCDate(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to get all dates between two dates (inclusive)
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = parseUTCDate(startDate)
  const end = parseUTCDate(endDate)

  // For all-day events, Google Calendar uses exclusive end date
  // So we need to subtract one day from the end
  end.setUTCDate(end.getUTCDate() - 1)

  const current = new Date(start)
  while (current <= end) {
    dates.push(formatUTCDate(current))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

// Build a stable identifier per occurrence.
// For recurring events, each occurrence should be handled independently.
function getOccurrenceSeriesId(item: GoogleCalendarEvent): string {
  const originalStart = item.originalStartTime?.dateTime || item.originalStartTime?.date

  if (item.recurringEventId && originalStart) {
    return `${item.recurringEventId}::${originalStart}`
  }

  return item.id
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const locale = (query.locale as string) || 'es'
  const t = translations[locale as keyof typeof translations] || translations.es

  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY
  const calendarId = process.env.GOOGLE_CALENDAR_ID

  // If no API key configured, return empty events with a message
  if (!apiKey || !calendarId) {
    console.warn(
      'Google Calendar not configured. Set GOOGLE_CALENDAR_API_KEY and GOOGLE_CALENDAR_ID in .env'
    )
    return {
      events: [],
      configured: false,
      message: 'Google Calendar API not configured',
    }
  }

  try {
    // Get events from 3 months ago to 3 months in the future
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
      // Google Calendar API supports up to 2500 items per page.
      // We still paginate to avoid truncating dense calendars.
      maxResults: '2500',
    })

    const allItems: GoogleCalendarEvent[] = []
    let nextPageToken: string | undefined

    do {
      const params = new URLSearchParams(baseParams)
      if (nextPageToken) {
        params.set('pageToken', nextPageToken)
      }

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`
      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Google Calendar API error:', errorData)
        throw createError({
          statusCode: response.status,
          message: errorData.error?.message || 'Error fetching calendar events',
        })
      }

      const data: GoogleCalendarResponse = await response.json()
      allItems.push(...(data.items || []))
      nextPageToken = data.nextPageToken
    } while (nextPageToken)

    // Transform events to our format, expanding multi-day events
    const events: CalendarEventOutput[] = []

    for (const item of allItems) {
      const isAllDay = !item.start.dateTime
      const seriesId = getOccurrenceSeriesId(item)
      const title = item.summary || (locale === 'es' ? 'Sin título' : 'Untitled')

      if (isAllDay) {
        // All-day event - check if it spans multiple days
        const startDate = item.start.date!
        const endDate = item.end.date!

        // Check if multi-day (end date is exclusive in Google Calendar)
        // A single-day event: start=Jan1, end=Jan2 → diff=1 (1 día real)
        // A two-day event: start=Jan1, end=Jan3 → diff=2 (2 días reales)
        // So we need daysDiff >= 2 to be considered multi-day
        const startD = parseUTCDate(startDate)
        const endD = parseUTCDate(endDate)
        const daysDiff = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))

        if (daysDiff >= 2) {
          // Multi-day event - create an entry for each day
          // getDateRange already adjusts for Google's exclusive end date
          const dateRange = getDateRange(startDate, endDate)
          const totalDays = dateRange.length

          dateRange.forEach((date, index) => {
            const dayNumber = index + 1
            const timeSlot = `${t.day} ${dayNumber} ${t.of} ${totalDays}`

            events.push({
              id: `${seriesId}-day-${dayNumber}`,
              seriesId,
              title,
              date,
              startDate,
              endDate: dateRange[dateRange.length - 1],
              timeSlot,
              isAllDay: true,
              description: item.description,
              location: item.location,
              isMultiDay: true,
            })
          })
        } else {
          // Single all-day event
          events.push({
            id: item.id,
            seriesId,
            title,
            date: startDate,
            startDate,
            endDate: startDate,
            timeSlot: t.allDay,
            isAllDay: true,
            description: item.description,
            location: item.location,
          })
        }
      } else {
        // Timed event - check if it spans multiple days
        const startDate = new Date(item.start.dateTime!)
        const endDate = new Date(item.end.dateTime!)

        const startDateStr = formatUTCDate(startDate)
        const endDateStr = formatUTCDate(endDate)

        const localeCode = locale === 'es' ? 'es-ES' : 'en-US'
        const formatTime = (d: Date) =>
          d.toLocaleTimeString(localeCode, {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          })

        if (startDateStr !== endDateStr) {
          // Multi-day timed event
          const startD = parseUTCDate(startDateStr)
          const endD = parseUTCDate(endDateStr)
          const daysDiff = Math.round((endD.getTime() - startD.getTime()) / (1000 * 60 * 60 * 24))
          const totalDays = daysDiff + 1 // Total days includes both start and end

          // First day
          events.push({
            id: `${seriesId}-day-1`,
            seriesId,
            title,
            date: startDateStr,
            startDate: startDateStr,
            endDate: endDateStr,
            timeSlot: `${t.from} ${formatTime(startDate)} (${t.day} 1 ${t.of} ${totalDays})`,
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            isAllDay: false,
            description: item.description,
            location: item.location,
            isMultiDay: true,
          })

          // Middle days (if any)
          const current = new Date(startD)
          current.setUTCDate(current.getUTCDate() + 1)
          let dayIndex = 2

          while (current < endD) {
            const dateStr = formatUTCDate(current)
            events.push({
              id: `${seriesId}-day-${dayIndex}`,
              seriesId,
              title,
              date: dateStr,
              startDate: startDateStr,
              endDate: endDateStr,
              timeSlot: `${t.day} ${dayIndex} ${t.of} ${totalDays}`,
              startTime: formatTime(startDate),
              endTime: formatTime(endDate),
              isAllDay: false,
              description: item.description,
              location: item.location,
              isMultiDay: true,
            })
            current.setUTCDate(current.getUTCDate() + 1)
            dayIndex++
          }

          // Last day
          events.push({
            id: `${seriesId}-day-${totalDays}`,
            seriesId,
            title,
            date: endDateStr,
            startDate: startDateStr,
            endDate: endDateStr,
            timeSlot: `${t.until} ${formatTime(endDate)} (${t.day} ${totalDays} ${t.of} ${totalDays})`,
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            isAllDay: false,
            description: item.description,
            location: item.location,
            isMultiDay: true,
          })
        } else {
          // Same-day timed event
          events.push({
            id: item.id,
            seriesId,
            title,
            date: startDateStr,
            startDate: startDateStr,
            endDate: startDateStr,
            timeSlot: `${formatTime(startDate)} - ${formatTime(endDate)}`,
            startTime: formatTime(startDate),
            endTime: formatTime(endDate),
            isAllDay: false,
            description: item.description,
            location: item.location,
          })
        }
      }
    }

    return {
      events,
      configured: true,
    }
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error)

    // Return empty events instead of throwing to prevent page from breaking
    return {
      events: [],
      configured: true,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
})
