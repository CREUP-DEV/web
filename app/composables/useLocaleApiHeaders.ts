export function useLocaleApiHeaders() {
  const { locale } = useI18n()

  return computed(() => ({
    'x-request-locale': locale.value,
  }))
}
