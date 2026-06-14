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

    // Reassemble into a compact "9 jun"-style date so locales that inject a
    // connector around the month fall back to the bare "day month" of es/en.
    // The connector shows up in one of two shapes depending on the locale:
    //   - inside the month token — Catalan's short month is "de juny", so we
    //     swap it for the standalone short month ("juny").
    //   - as its own literal part — Galician renders "16 de xuño" with " de "
    //     as a separate literal, so we collapse connector-word literals to a
    //     single space.
    // Spanish/English are unaffected (whitespace-only literals, identical
    // standalone month).
    const parts = new Intl.DateTimeFormat(currentLanguageTag.value, formatOptions).formatToParts(
      date
    )
    const standaloneMonth = new Intl.DateTimeFormat(currentLanguageTag.value, {
      month: 'short',
    }).format(date)

    const isConnectorLiteral = (value: string) => /^\s*\p{L}+\s*$/u.test(value)

    return parts
      .map((part) => {
        if (part.type === 'month') return standaloneMonth
        if (part.type === 'literal' && isConnectorLiteral(part.value)) return ' '
        return part.value
      })
      .join('')
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
