export interface MockDataCarouselItem {
  image: string
  href: string
  title: string
  buttonText: string
}

export interface MockDataFeaturedNewsItem {
  image: string
  to: string
  title: string
}

export interface MockDataFeaturedLinkItem {
  image: string
  to: string
  title: string
}

export interface MockDataResponse {
  carousel: MockDataCarouselItem[]
  featuredNews: MockDataFeaturedNewsItem[]
  featuredLinks: MockDataFeaturedLinkItem[]
}

export function useMockData() {
  const { locale } = useI18n()

  return useAsyncData<MockDataResponse>(
    'mock-data',
    () => $fetch<MockDataResponse>('/api/mock-data'),
    {
      server: false, // client only
      lazy: true, // fetch after mount
      watch: [locale], // refetch on locale change
    }
  )
}
