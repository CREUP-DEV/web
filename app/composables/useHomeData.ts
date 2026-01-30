/**
 * Composable for fetching home page data from the database
 */

export interface CarouselItem {
  image: string
  href: string
  title: string
  buttonText: string
  alt?: string
}

export interface FeaturedNewsItem {
  image: string
  to: string
  title: string
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
  featuredNews: FeaturedNewsItem[]
  featuredLinks: FeaturedLinkItem[]
}

export function useHomeData() {
  const { locale } = useI18n()

  return useAsyncData<HomeDataResponse>(
    'home-data',
    () => $fetch<HomeDataResponse>('/api/home-data'),
    {
      watch: [locale],
    }
  )
}
