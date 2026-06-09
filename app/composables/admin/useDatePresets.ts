export function useDatePresets() {
  const { formatDate: formatLocaleDate, currentLanguageTag } = useLocaleFormatting()

  const toStartOfDay = (dateStr: string) => new Date(`${dateStr}T00:00:00`)

  const formatShortDate = (
    dateStr: string,
    options: {
      includeYear?: boolean
    } = {}
  ) => {
    const date = new Date(`${dateStr}T00:00:00`)
    const formatOptions: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      ...(options.includeYear ? { year: 'numeric' } : {}),
    }

    // Reassemble using the standalone short month so locales whose combined
    // day+month format injects a connector (Catalan renders "9 de juny") fall
    // back to the compact "9 juny", matching the "9 jun" / "9 Jun" of es/en.
    // Spanish and English are unaffected (their standalone short month is identical).
    const parts = new Intl.DateTimeFormat(currentLanguageTag.value, formatOptions).formatToParts(
      date
    )
    const standaloneMonth = new Intl.DateTimeFormat(currentLanguageTag.value, {
      month: 'short',
    }).format(date)

    return parts.map((part) => (part.type === 'month' ? standaloneMonth : part.value)).join('')
  }

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
