export interface CalendarEvent {
  id: string
  seriesId: string
  title: string
  date: string // YYYY-MM-DD
  startDate: string // YYYY-MM-DD (series start)
  endDate?: string // YYYY-MM-DD for multi-day events
  timeSlot: string // e.g. "10:00 - 12:00" or "All day"
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  description?: string
  location?: string
  isMultiDay?: boolean
}

export function useGoogleCalendar() {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  const key = computed(() => `google-calendar-events-${locale.value}`)

  const { data, pending, error, refresh } = useAsyncData<{ events: CalendarEvent[] }>(
    key,
    () =>
      $fetch<{ events: CalendarEvent[] }>('/api/calendar', {
        headers: localeApiHeaders.value,
      }),
    {
      default: () => ({ events: [] as CalendarEvent[] }),
      watch: [locale],
    }
  )

  const events = computed(() => data.value?.events ?? [])

  return {
    events,
    pending,
    error,
    refresh,
  }
}
