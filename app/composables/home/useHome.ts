import { getPublicHomeAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'
import type { PressArticle } from '@/composables/press/usePress'

export interface CarouselItem {
  image: string | null
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

export interface HomeResponse {
  data: {
    carousel: CarouselItem[]
    featuredLinks: FeaturedLinkItem[]
    featuredPress: {
      items: Array<PressArticle & { path: string }>
    }
  }
}

export function useHome() {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  const key = computed(() => getPublicHomeAsyncDataKey(locale.value))

  return useAsyncData<HomeResponse>(
    key,
    () =>
      $fetch<HomeResponse>('/api/home', {
        headers: localeApiHeaders.value,
      }),
    {
      default: () => ({
        data: {
          carousel: [],
          featuredLinks: [],
          featuredPress: {
            items: [],
          },
        },
      }),
      watch: [locale],
    }
  )
}
