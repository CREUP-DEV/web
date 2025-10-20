export interface MockDataMeta {
  requestedLocale: string
  resolvedLocale: string
  fallbackApplied: boolean
  availableLocales: string[]
}

export interface MockDataItem {
  image: string
  href: string
  title: string
  buttonText: string
}

export interface MockDataResponse {
  carousel: MockDataItem[]
  meta: MockDataMeta
}

export function useMockData() {
  const { locale } = useI18n()

  return useAsyncData<MockDataResponse>(
    'mock-data',
    () =>
      $fetch<MockDataResponse>('/api/mock-data', {
        query: { locale: locale.value },
      }),
    {
      // Do not fetch during SSR to avoid blocking the initial HTML
      server: false,
      // Start with pending=true and fetch on client after mount
      lazy: true,
      // Refetch whenever the active locale changes
      watch: [locale],
    }
  )
}
