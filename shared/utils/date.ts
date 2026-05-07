export const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface DateOnlyParts {
  year: number
  month: number
  day: number
}

export function isDateOnlyString(value: unknown): value is string {
  return typeof value === 'string' && DATE_ONLY_PATTERN.test(value.trim())
}

export function parseDateOnlyString(value: unknown): DateOnlyParts | null {
  if (!isDateOnlyString(value)) {
    return null
  }

  const normalizedValue = value.trim()
  const [yearRaw, monthRaw, dayRaw] = normalizedValue.split('-')

  if (!yearRaw || !monthRaw || !dayRaw) {
    return null
  }

  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day))
  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return null
  }

  return { year, month, day }
}

export function dateOnlyPartsToString(value: DateOnlyParts) {
  return `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`
}

export function calendarDateLikeToDateOnly(value: DateOnlyParts) {
  return dateOnlyPartsToString(value)
}

export function dateTimeStringToDateOnly(value: string | null | undefined) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmedValue = value.trim()
  const [dateOnlyValue] = trimmedValue.split('T')

  return parseDateOnlyString(dateOnlyValue) ? dateOnlyValue : ''
}

export function dateOnlyToStorageDate(value: string) {
  const parts = parseDateOnlyString(value)

  if (!parts) {
    throw new Error('Invalid date-only value')
  }

  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12, 0, 0))
}

export function dateValueToDateOnly(
  value: string | number | Date,
  timeZone = 'Europe/Madrid'
): string {
  const parsedDateOnly = parseDateOnlyString(value)

  if (parsedDateOnly) {
    return dateOnlyPartsToString(parsedDateOnly)
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  const day = parts.find((part) => part.type === 'day')?.value

  if (!year || !month || !day) {
    return ''
  }

  return `${year}-${month}-${day}`
}
