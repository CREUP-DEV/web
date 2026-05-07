import { parseDateOnlyString } from '~~/shared/utils/date'

export function useLocaleFormatting() {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()

  const currentLanguageTag = computed(() => getLanguageTag(locale.value))

  const formatDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions = {}) => {
    const parsedDateOnly = parseDateOnlyString(value)

    if (parsedDateOnly) {
      return new Date(
        Date.UTC(parsedDateOnly.year, parsedDateOnly.month - 1, parsedDateOnly.day)
      ).toLocaleDateString(currentLanguageTag.value, {
        ...options,
        timeZone: options.timeZone ?? 'UTC',
      })
    }

    return new Date(value).toLocaleDateString(currentLanguageTag.value, options)
  }

  const formatTime = (value: string | number | Date, options: Intl.DateTimeFormatOptions = {}) =>
    new Date(value).toLocaleTimeString(currentLanguageTag.value, options)

  const formatDateTime = (
    value: string | number | Date,
    options: Intl.DateTimeFormatOptions = {}
  ) => new Date(value).toLocaleString(currentLanguageTag.value, options)

  return {
    currentLanguageTag,
    formatDate,
    formatTime,
    formatDateTime,
  }
}
