import { getPublicHomeAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'
import type { PressArticle } from '@/composables/press/usePress'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

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

export interface RecentActivityMemberOrg {
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
}

export interface RecentActivityItem {
  id: string
  kind: 'creup' | 'member'
  slug: string
  path: string
  image: string | null
  startDate: string
  endDate: string | null
  isOnline: boolean
  location: string | null
  title: string
  excerpt: string
  alt: string
  titleLocale: string | null
  excerptLocale: string | null
  memberOrg: RecentActivityMemberOrg | null
}

export interface HomeResponse {
  data: {
    carousel: CarouselItem[]
    featuredLinks: FeaturedLinkItem[]
    featuredPress: {
      items: Array<PressArticle & { path: string }>
    }
    recentActivity: {
      items: RecentActivityItem[]
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
          recentActivity: {
            items: [],
          },
        },
      }),
      getCachedData: publicCmsCachedData,
      watch: [locale],
    }
  )
}
