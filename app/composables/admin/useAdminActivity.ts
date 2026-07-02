import { refDebounced } from '@vueuse/core'
import type { MaybeRef } from 'vue'
import type { ActivityKind, MemberOrgSource } from '~~/shared/constants/activity'

export type AdminActivityKind = ActivityKind

export interface AdminActivityTranslation {
  locale: string
  title: string
  excerpt: string | null
  contentHtml: string | null
  imageCaption: string | null
  alt: string | null
}

export interface AdminMemberOrgSnapshot {
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
}

export interface AdminActivityEntry {
  id: string
  kind: AdminActivityKind
  slug: string
  image: string | null
  /** Resolved list thumbnail (admin list only). */
  listThumbnailUrl: string | null
  startDate: string
  endDate: string | null
  isOnline: boolean
  location: string | null
  memberOrgSource: MemberOrgSource | null
  memberOrgId: string | null
  memberOrgSnapshot: AdminMemberOrgSnapshot | null
  active: boolean
  updatedAt: string
  translations: AdminActivityTranslation[]
}

export interface AdminActivityResponse {
  data: AdminActivityEntry[]
  meta: {
    total: number
  }
}

const ADMIN_ACTIVITY_PAGE_SIZE = 12

export function useAdminActivity(
  kind: MaybeRef<AdminActivityKind | null>,
  search: MaybeRef<string>
) {
  const localeApiHeaders = useLocaleApiHeaders()
  const kindValue = computed(() => unref(kind))
  const searchValue = computed(() => unref(search))
  const debouncedSearch = refDebounced(searchValue, 300)

  const page = ref(1)
  const offset = computed(() => (page.value - 1) * ADMIN_ACTIVITY_PAGE_SIZE)

  // Reset to first page when filters change
  watch([kindValue, debouncedSearch], () => {
    page.value = 1
  })

  const key = computed(
    () => `admin-activity-${kindValue.value ?? 'all'}-${debouncedSearch.value}-p${page.value}`
  )

  const { data, pending, error, refresh } = useAsyncData<AdminActivityResponse>(
    key,
    () => {
      const params = new URLSearchParams()
      if (kindValue.value) params.set('kind', kindValue.value)
      if (debouncedSearch.value) params.set('search', debouncedSearch.value)
      params.set('limit', String(ADMIN_ACTIVITY_PAGE_SIZE))
      params.set('offset', String(offset.value))
      return $fetch<AdminActivityResponse>(`/api/admin/activity?${params.toString()}`, {
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
  const pageCount = computed(() => Math.ceil(total.value / ADMIN_ACTIVITY_PAGE_SIZE))

  const decrementTotal = () => {
    updateMeta((meta) => ({
      total: Math.max(0, (meta?.total ?? 0) - 1),
    }))
  }

  return {
    decrementTotal,
    error,
    items,
    page,
    pageCount,
    pageSize: ADMIN_ACTIVITY_PAGE_SIZE,
    pending,
    refresh,
    removeItem,
    total,
  }
}
