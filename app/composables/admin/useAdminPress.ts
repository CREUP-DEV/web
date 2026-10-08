import { refDebounced } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import type { PressArticleType } from '~~/shared/constants/pressTypes'

export type AdminPressArticleType = PressArticleType

export interface AdminPressTranslation {
  locale: string
  title: string
  description: string
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
  /** Resolved list thumbnail including site default per type (admin list only). */
  listThumbnailUrl: string | null
  pdfUrl: string | null
  externalUrl: string | null
  mediaOutletId: string | null
  active: boolean
  publishedAt: string
  updatedAt: string
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
  data: AdminPressArticle[]
  meta: {
    total: number
  }
}

const ADMIN_PRESS_PAGE_SIZE = 20

export function useAdminPress(
  type: MaybeRef<AdminPressArticleType | null>,
  search: MaybeRef<string>
) {
  const localeApiHeaders = useLocaleApiHeaders()
  // Forwards the session cookie during SSR; a bare `$fetch` there would answer 401 on a full load.
  const requestFetch = useRequestFetch()
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

  const { data, pending, error, refresh } = useAsyncData<AdminPressResponse>(
    key,
    () => {
      const params = new URLSearchParams()
      if (typeValue.value) params.set('type', typeValue.value)
      if (debouncedSearch.value) params.set('search', debouncedSearch.value)
      params.set('limit', String(ADMIN_PRESS_PAGE_SIZE))
      params.set('offset', String(offset.value))
      return requestFetch<AdminPressResponse>(`/api/admin/press?${params.toString()}`, {
        headers: localeApiHeaders.value,
      })
    },
    {
      default: () => ({ data: [], meta: { total: 0 } }),
      watch: [key],
    }
  )

  const { items, removeItem, updateMeta } = useAdminMutableCollection(data)
  const total = computed(() => data.value?.meta.total ?? 0)
  const pageCount = computed(() => Math.ceil(total.value / ADMIN_PRESS_PAGE_SIZE))

  const decrementTotal = () => {
    updateMeta((meta) => ({
      total: Math.max(0, (meta?.total ?? 0) - 1),
    }))
  }

  /**
   * Backfills the page after a row was removed locally: steps back when that emptied a later page
   * (the key change refetches), otherwise refetches so the next page's first row moves up.
   */
  const refreshAfterRemoval = async () => {
    if (!items.value.length && page.value > 1) {
      page.value -= 1
      return
    }

    await refresh()
  }

  return {
    decrementTotal,
    error,
    items,
    page,
    pageCount,
    pending,
    refresh,
    refreshAfterRemoval,
    removeItem,
    total,
  }
}
