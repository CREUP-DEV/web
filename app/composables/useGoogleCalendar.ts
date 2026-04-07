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

  const { data, pending, error, refresh } = useAsyncData<{ events: CalendarEvent[] }>(
    () => `google-calendar-events-${locale.value}`,
    () =>
      $fetch<{ events: CalendarEvent[] }>('/api/calendar', {
        headers: localeApiHeaders.value,
      }),
    {
      watch: [locale],
    }
  )

  const events = computed(() => data.value?.events ?? [])
  const isLoading = computed(() => pending.value || data.value == null)

  return {
    events,
    pending,
    isLoading,
    error,
    refresh,
  }
}
