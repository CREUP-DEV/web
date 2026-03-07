export function useLocaleFormatting() {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()

  const currentLanguageTag = computed(() => getLanguageTag(locale.value))

  const formatDate = (value: string | number | Date, options: Intl.DateTimeFormatOptions = {}) =>
    new Date(value).toLocaleDateString(currentLanguageTag.value, options)

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
