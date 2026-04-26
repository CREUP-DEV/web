import type { CalendarEvent } from '@/composables/events/useGoogleCalendar'

export function getCalendarEventEndDateTime(event: CalendarEvent, endDate: string) {
  if (event.isAllDay) {
    return new Date(`${endDate}T23:59:59`)
  }

  if (event.endTime) {
    return new Date(`${endDate}T${event.endTime}`)
  }

  return new Date(`${endDate}T23:59:59`)
}

export function collectUpcomingCalendarSeries(
  events: CalendarEvent[],
  options: {
    limit: number
    allDayLabel: string
  }
) {
  const now = new Date()
  const bySeries = new Map<string, CalendarEvent>()

  for (const event of events) {
    const seriesId = event.seriesId || event.id
    const startDate = event.startDate || event.date
    const endDate = event.endDate || event.date
    const endDateTime = getCalendarEventEndDateTime(event, endDate)

    if (endDateTime.getTime() < now.getTime()) {
      continue
    }

    const existing = bySeries.get(seriesId)
    const normalizedEvent: CalendarEvent = {
      ...event,
      startDate,
      endDate,
      timeSlot: event.isAllDay ? options.allDayLabel : event.timeSlot,
    }

    if (!existing) {
      bySeries.set(seriesId, normalizedEvent)
      continue
    }

    const existingStart = existing.startDate || existing.date
    const existingEnd = existing.endDate || existing.date

    if (startDate < existingStart) {
      existing.startDate = startDate
    }

    if (endDate > existingEnd) {
      existing.endDate = endDate
    }

    if (existing.isAllDay) {
      existing.timeSlot = options.allDayLabel
    }
  }

  return Array.from(bySeries.values())
    .sort((left, right) =>
      (left.startDate || left.date).localeCompare(right.startDate || right.date)
    )
    .slice(0, options.limit)
}
