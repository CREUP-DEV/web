import { pickLocalizedValue } from '~~/shared/utils/locale'
import { dateTimeStringToDateOnly } from '~~/shared/utils/date'

export interface GoogleCalendarEvent {
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

export interface CalendarEventOutput {
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

interface CalendarLocaleLabels {
  allDay: string
  day: string
  of: string
  from: string
  until: string
  untitled: string
}

const calendarLocaleLabelsByLocale: Record<string, CalendarLocaleLabels> = {
  es: {
    allDay: 'Todo el día',
    day: 'Día',
    of: 'de',
    from: 'Desde',
    until: 'Hasta',
    untitled: 'Sin título',
  },
  en: {
    allDay: 'All day',
    day: 'Day',
    of: 'of',
    from: 'From',
    until: 'Until',
    untitled: 'Untitled',
  },
}

export function getCalendarLocaleLabels(
  locale: string | null | undefined,
  fallbackLocale: string | null | undefined
): CalendarLocaleLabels {
  const labels = pickLocalizedValue(calendarLocaleLabelsByLocale, locale, fallbackLocale)
  return labels ?? calendarLocaleLabelsByLocale.es!
}

export function parseUTCDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year!, month! - 1, day))
}

export function formatUTCDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getDateRange(startDate: string, endDate: string) {
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

export function getOccurrenceSeriesId(item: GoogleCalendarEvent) {
  const originalStart = item.originalStartTime?.dateTime || item.originalStartTime?.date

  if (item.recurringEventId && originalStart) {
    return `${item.recurringEventId}::${originalStart}`
  }

  return item.id
}

export function transformGoogleCalendarItems(
  items: GoogleCalendarEvent[],
  options: {
    languageTag: string
    locale: string | null | undefined
    fallbackLocale: string | null | undefined
  }
) {
  const labels = getCalendarLocaleLabels(options.locale, options.fallbackLocale)
  const formatTime = (value: Date) =>
    value.toLocaleTimeString(options.languageTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

  const events: CalendarEventOutput[] = []

  for (const item of items) {
    const seriesId = getOccurrenceSeriesId(item)
    const title = item.summary || labels.untitled

    if (!item.start.dateTime && item.start.date && item.end.date) {
      const dateRange = getDateRange(item.start.date, item.end.date)
      const totalDays = dateRange.length

      if (totalDays > 1) {
        dateRange.forEach((date, index) => {
          const dayNumber = index + 1

          events.push({
            id: `${seriesId}-day-${dayNumber}`,
            seriesId,
            title,
            date,
            startDate: item.start.date!,
            endDate: dateRange[dateRange.length - 1],
            timeSlot: `${labels.day} ${dayNumber} ${labels.of} ${totalDays}`,
            isAllDay: true,
            description: item.description,
            location: item.location,
            isMultiDay: true,
          })
        })
      } else {
        events.push({
          id: item.id,
          seriesId,
          title,
          date: item.start.date,
          startDate: item.start.date,
          endDate: item.start.date,
          timeSlot: labels.allDay,
          isAllDay: true,
          description: item.description,
          location: item.location,
          isMultiDay: false,
        })
      }

      continue
    }

    if (!item.start.dateTime || !item.end.dateTime) {
      continue
    }

    const startDate = new Date(item.start.dateTime)
    const endDate = new Date(item.end.dateTime)
    const startDateStr = dateTimeStringToDateOnly(item.start.dateTime)
    const endDateStr = dateTimeStringToDateOnly(item.end.dateTime)

    if (!startDateStr || !endDateStr) {
      continue
    }

    if (startDateStr !== endDateStr) {
      const startDay = parseUTCDate(startDateStr)
      const endDay = parseUTCDate(endDateStr)
      const dayCount =
        Math.round((endDay.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) + 1

      events.push({
        id: `${seriesId}-day-1`,
        seriesId,
        title,
        date: startDateStr,
        startDate: startDateStr,
        endDate: endDateStr,
        timeSlot: `${labels.from} ${formatTime(startDate)} (${labels.day} 1 ${labels.of} ${dayCount})`,
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        isAllDay: false,
        description: item.description,
        location: item.location,
        isMultiDay: true,
      })

      const current = new Date(startDay)
      current.setUTCDate(current.getUTCDate() + 1)

      for (let dayNumber = 2; current < endDay; dayNumber++) {
        events.push({
          id: `${seriesId}-day-${dayNumber}`,
          seriesId,
          title,
          date: formatUTCDate(current),
          startDate: startDateStr,
          endDate: endDateStr,
          timeSlot: `${labels.day} ${dayNumber} ${labels.of} ${dayCount}`,
          startTime: formatTime(startDate),
          endTime: formatTime(endDate),
          isAllDay: false,
          description: item.description,
          location: item.location,
          isMultiDay: true,
        })

        current.setUTCDate(current.getUTCDate() + 1)
      }

      events.push({
        id: `${seriesId}-day-${dayCount}`,
        seriesId,
        title,
        date: endDateStr,
        startDate: startDateStr,
        endDate: endDateStr,
        timeSlot: `${labels.until} ${formatTime(endDate)} (${labels.day} ${dayCount} ${labels.of} ${dayCount})`,
        startTime: formatTime(startDate),
        endTime: formatTime(endDate),
        isAllDay: false,
        description: item.description,
        location: item.location,
        isMultiDay: true,
      })

      continue
    }

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
      isMultiDay: false,
    })
  }

  return events
}
