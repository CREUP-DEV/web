import { refDebounced } from '@vueuse/core'
import type { MaybeRef } from 'vue'

export interface AdminAreaReportTranslation {
  locale: string
  contentHtml: string | null
  imageCaption: string | null
  alt: string | null
}

export interface AdminAreaReportEdition {
  monthKey: string
  coversFrom: string | null
}

export interface AdminAreaReport {
  id: string
  monthKey: string
  areaId: number
  areaNameSnapshot: Record<string, string> | null
  areaOrderSnapshot: number | null
  image: string | null
  /** Resolved list thumbnail (admin list only). */
  listThumbnailUrl: string | null
  active: boolean
  updatedAt: string
  translations: AdminAreaReportTranslation[]
  edition: AdminAreaReportEdition | null
}

export interface AdminAreaReportsResponse {
  data: AdminAreaReport[]
  meta: {
    total: number
  }
}

const ADMIN_AREA_REPORTS_PAGE_SIZE = 12

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

export function useAdminAreaReports(month: MaybeRef<string>) {
  const localeApiHeaders = useLocaleApiHeaders()
  // Only forward a fully-formed 'YYYY-MM' month to the API; partial values are treated as no filter
  // so mid-typing keystrokes never trigger a 400 from the strict server-side month validator.
  const monthValue = computed(() => {
    const value = unref(month).trim()
    return MONTH_KEY_PATTERN.test(value) ? value : ''
  })
  const debouncedMonth = refDebounced(monthValue, 300)

  const page = ref(1)
  const offset = computed(() => (page.value - 1) * ADMIN_AREA_REPORTS_PAGE_SIZE)

  watch(debouncedMonth, () => {
    page.value = 1
  })

  const key = computed(() => `admin-area-reports-${debouncedMonth.value || 'all'}-p${page.value}`)

  const { data, pending, error, refresh } = useAsyncData<AdminAreaReportsResponse>(
    key,
    () => {
      const params = new URLSearchParams()
      if (debouncedMonth.value) params.set('month', debouncedMonth.value)
      params.set('limit', String(ADMIN_AREA_REPORTS_PAGE_SIZE))
      params.set('offset', String(offset.value))
      return $fetch<AdminAreaReportsResponse>(`/api/admin/area-reports?${params.toString()}`, {
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
  const pageCount = computed(() => Math.ceil(total.value / ADMIN_AREA_REPORTS_PAGE_SIZE))

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
    pageSize: ADMIN_AREA_REPORTS_PAGE_SIZE,
    pending,
    refresh,
    removeItem,
    total,
  }
}
