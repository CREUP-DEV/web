export interface CarouselItem {
  image: string
  href: string
  title: string
  buttonText: string
  alt?: string
}

export interface FeaturedLinkItem {
  image: string
  to: string
  title: string
  alt?: string
}

export interface HomeDataResponse {
  carousel: CarouselItem[]
  featuredLinks: FeaturedLinkItem[]
}

export function useHomeData() {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  return useAsyncData<HomeDataResponse>(
    () => `home-data-${locale.value}`,
    () =>
      $fetch<HomeDataResponse>('/api/home-data', {
        headers: localeApiHeaders.value,
      }),
    {
      default: () => ({
        carousel: [],
        featuredLinks: [],
      }),
      watch: [locale],
    }
  )
}
