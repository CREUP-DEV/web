import { refDebounced } from '@vueuse/core'
import type { MaybeRef } from 'vue'

export type AdminPressArticleType = 'press_release' | 'statement' | 'media_appearance'

export interface AdminPressTranslation {
  locale: string
  title: string
  description: string
  contentHtml: string
  alt: string
}

export interface AdminPressTagTranslation {
  locale: string
  name: string
}

export interface AdminPressTag {
  id: string
  slug: string
  translations: AdminPressTagTranslation[]
}

export interface AdminPressMediaOutlet {
  id: string
  name: string
  website: string
  logo: string
}

export interface AdminPressArticle {
  id: string
  type: AdminPressArticleType
  slug: string
  image: string | null
  pdfUrl: string | null
  externalUrl: string | null
  mediaOutletId: string | null
  active: boolean
  publishedAt: string
  translations: AdminPressTranslation[]
  tags: Array<{
    id: string
    pressArticleId: string
    tagId: string
    tag: AdminPressTag
  }>
  mediaOutlet: AdminPressMediaOutlet | null
}

export interface AdminPressResponse {
  items: AdminPressArticle[]
  total: number
}

const ADMIN_PRESS_PAGE_SIZE = 20

export function useAdminPress(
  type: MaybeRef<AdminPressArticleType | null>,
  search: MaybeRef<string>
) {
  const typeValue = computed(() => unref(type))
  const searchValue = computed(() => unref(search))
  const debouncedSearch = refDebounced(searchValue, 300)

  const page = ref(1)
  const offset = computed(() => (page.value - 1) * ADMIN_PRESS_PAGE_SIZE)

  // Reset to first page when filters change
  watch([typeValue, debouncedSearch], () => {
    page.value = 1
  })

  const key = computed(
    () => `admin-press-${typeValue.value ?? 'all'}-${debouncedSearch.value}-p${page.value}`
  )

  const { data, pending, refresh } = useAsyncData<AdminPressResponse>(
    key,
    () => {
      const params = new URLSearchParams()
      if (typeValue.value) params.set('type', typeValue.value)
      if (debouncedSearch.value) params.set('search', debouncedSearch.value)
      params.set('limit', String(ADMIN_PRESS_PAGE_SIZE))
      params.set('offset', String(offset.value))
      return $fetch<AdminPressResponse>(`/api/admin/press?${params.toString()}`)
    },
    {
      default: () => ({ items: [], total: 0 }),
      watch: [key],
    }
  )

  const items = computed(() => data.value?.items ?? [])
  const total = computed(() => data.value?.total ?? 0)
  const pageCount = computed(() => Math.ceil(total.value / ADMIN_PRESS_PAGE_SIZE))

  return { items, total, pageCount, page, pending, refresh }
}
