export function useDatePresets() {
  const { formatDate: formatLocaleDate } = useLocaleFormatting()

  const toStartOfDay = (dateStr: string) => new Date(`${dateStr}T00:00:00`)

  const formatShortDate = (
    dateStr: string,
    options: {
      includeYear?: boolean
    } = {}
  ) =>
    formatLocaleDate(`${dateStr}T00:00:00`, {
      day: 'numeric',
      month: 'short',
      ...(options.includeYear ? { year: 'numeric' } : {}),
    })

  const formatLongDate = (dateStr: string) =>
    formatLocaleDate(`${dateStr}T00:00:00`, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })

  const formatMonthYear = (dateStr: string) =>
    formatLocaleDate(`${dateStr}T00:00:00`, {
      month: 'short',
      year: 'numeric',
    })

  const formatDateRange = (
    startDate: string,
    endDate?: string | null,
    options: {
      includeYear?: boolean
    } = {}
  ) => {
    const formattedStartDate = formatShortDate(startDate, options)
    if (!endDate) {
      return formattedStartDate
    }

    return `${formattedStartDate} - ${formatShortDate(endDate, options)}`
  }

  const isDateRangeUpcoming = (startDate: string, endDate?: string | null) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const effectiveEndDate = toStartOfDay(endDate || startDate)
    return effectiveEndDate >= now
  }

  const isDateRangeOngoing = (startDate: string, endDate?: string | null) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const normalizedStartDate = toStartOfDay(startDate)
    const normalizedEndDate = toStartOfDay(endDate || startDate)

    return normalizedStartDate <= now && now <= normalizedEndDate
  }

  return {
    formatDateRange,
    formatLongDate,
    formatMonthYear,
    formatShortDate,
    isDateRangeOngoing,
    isDateRangeUpcoming,
  }
}
