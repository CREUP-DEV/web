import type { MaybeRef } from 'vue'
import { parseDateOnlyString } from '~~/shared/utils/date'

export type ActivityKind = 'creup' | 'member'

export interface ActivityMemberOrg {
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
}

export interface ActivityListItem {
  id: string
  kind: ActivityKind
  slug: string
  image: string | null
  startDate: string
  endDate: string | null
  isOnline: boolean
  location: string | null
  title: string
  excerpt: string
  alt: string
  imageCaption: string | null
  titleLocale: string | null
  excerptLocale: string | null
  memberOrg: ActivityMemberOrg | null
}

export interface ActivityListResponse {
  data: ActivityListItem[]
  meta: {
    total: number
  }
}

export interface ActivityDetail {
  id: string
  kind: ActivityKind
  slug: string
  image: string | null
  startDate: string
  endDate: string | null
  isOnline: boolean
  location: string | null
  title: string
  excerpt: string
  alt: string
  imageCaption: string | null
  contentHtml: string | null
  titleLocale: string | null
  excerptLocale: string | null
  imageCaptionLocale: string | null
  contentLocale: string | null
  publishedAt: string
  updatedAt: string | null
  translatedLocales: string[]
  memberOrg: ActivityMemberOrg | null
}

export interface ActivityDetailResponse {
  data: ActivityDetail | null
}

export interface AreaReportEdition {
  monthKey: string
  coversFrom: string | null
}

export interface AreaReport {
  id: string
  areaId: number
  areaName: string
  areaOrder: number | null
  image: string | null
  contentHtml: string | null
  contentLocale: string | null
  imageCaption: string | null
  imageCaptionLocale: string | null
  alt: string | null
}

export interface AreaReportsResponse {
  data: {
    edition: AreaReportEdition | null
    reports: AreaReport[]
  }
}

export interface AreaReportsMonthsResponse {
  data: {
    anchors: AreaReportEdition[]
    coveredToAnchor: Record<string, string>
  }
}

export function useActivityList(
  kind?: MaybeRef<ActivityKind | null | undefined>,
  month?: MaybeRef<string | null | undefined>,
  limit?: MaybeRef<number | undefined>,
  offset?: MaybeRef<number | undefined>,
  search?: MaybeRef<string | null | undefined>
) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  const kindValue = computed(() => unref(kind) ?? null)
  const monthValue = computed(() => unref(month) ?? null)
  const searchValue = computed(() => unref(search)?.trim() || null)
  const limitValue = computed(() => {
    const value = unref(limit)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return undefined
  })
  const offsetValue = computed(() => {
    const value = unref(offset)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return 0
  })

  const activityKey = computed(
    () =>
      `activity-${locale.value}-${kindValue.value ?? 'all'}-${monthValue.value ?? 'none'}-${
        searchValue.value ?? 'none'
      }-${limitValue.value ?? 'all'}-${offsetValue.value}`
  )

  return useAsyncData<ActivityListResponse>(
    activityKey,
    () => {
      const params = new URLSearchParams()
      if (kindValue.value) {
        params.set('kind', kindValue.value)
      }
      if (monthValue.value) {
        params.set('month', monthValue.value)
      }
      if (searchValue.value) {
        params.set('q', searchValue.value)
      }
      if (limitValue.value != null) {
        params.set('limit', String(limitValue.value))
      }
      if (offsetValue.value > 0) {
        params.set('offset', String(offsetValue.value))
      }

      const queryString = params.toString()
      return $fetch<ActivityListResponse>(`/api/activity${queryString ? `?${queryString}` : ''}`, {
        headers: localeApiHeaders.value,
      })
    },
    {
      default: () => ({ data: [], meta: { total: 0 } }),
      watch: [locale, kindValue, monthValue, searchValue, limitValue, offsetValue],
    }
  )
}

export function useActivityEntry(slug: string) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()
  const entryKey = computed(() => `activity-entry-${slug}-${locale.value}`)

  return useAsyncData<ActivityDetailResponse>(
    entryKey,
    () =>
      $fetch<ActivityDetailResponse>(`/api/activity/${slug}`, {
        headers: localeApiHeaders.value,
      }),
    {
      default: () => ({ data: null }),
      watch: [locale],
    }
  )
}

export function useAreaReportsEdition(month: MaybeRef<string | null | undefined>) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()
  const monthValue = computed(() => unref(month) ?? null)
  const editionKey = computed(() => `area-reports-${locale.value}-${monthValue.value ?? 'none'}`)

  return useAsyncData<AreaReportsResponse>(
    editionKey,
    () => {
      if (!monthValue.value) {
        return Promise.resolve({ data: { edition: null, reports: [] } })
      }

      return $fetch<AreaReportsResponse>(`/api/area-reports?month=${monthValue.value}`, {
        headers: localeApiHeaders.value,
      })
    },
    {
      default: () => ({ data: { edition: null, reports: [] } }),
      watch: [locale, monthValue],
    }
  )
}

export function useAreaReportsMonths() {
  return useAsyncData<AreaReportsMonthsResponse>(
    'area-reports-months',
    () => $fetch<AreaReportsMonthsResponse>('/api/area-reports/months'),
    {
      default: () => ({ data: { anchors: [], coveredToAnchor: {} } }),
    }
  )
}

/**
 * Localized date helpers for activity entries and area-report editions.
 *
 * Single dates and ranges build on `useLocaleFormatting.formatDate`, which feeds Intl the active
 * locale's BCP-47 tag (so `val` -> `ca-ES-valencia`, resolved to Catalan formatting). Month keys are
 * expanded to `YYYY-MM-01` so `parseDateOnlyString` reads them in UTC and avoids off-by-one drift.
 */
export function useActivityDates() {
  const { formatDate } = useLocaleFormatting()

  const formatDay = (iso: string) =>
    formatDate(iso, { year: 'numeric', month: 'long', day: 'numeric' })

  const formatDateRange = (startDate: string, endDate: string | null) => {
    if (!endDate || endDate === startDate) {
      return formatDay(startDate)
    }

    const start = parseDateOnlyString(startDate)
    const end = parseDateOnlyString(endDate)

    // Same month and year: render "d–d MMMM yyyy" with a single trailing month/year.
    if (start && end && start.year === end.year && start.month === end.month) {
      const startDay = formatDate(startDate, { day: 'numeric' })
      const endLong = formatDate(endDate, { year: 'numeric', month: 'long', day: 'numeric' })
      return `${startDay}–${endLong}`
    }

    return `${formatDay(startDate)} – ${formatDay(endDate)}`
  }

  // Month labels stand alone as headings and select options, so they lead with a capital. Intl
  // lowercases month names in the Romance locales; English already capitalizes them and Basque
  // leads with the year, so uppercasing the first character is a no-op there.
  const formatMonthLabel = (monthKey: string) => {
    const label = formatDate(`${monthKey}-01`, { year: 'numeric', month: 'long' })
    return label.charAt(0).toUpperCase() + label.slice(1)
  }

  const formatEditionLabel = (edition: AreaReportEdition) => {
    if (!edition.coversFrom || edition.coversFrom === edition.monthKey) {
      return formatMonthLabel(edition.monthKey)
    }

    return `${formatMonthLabel(edition.coversFrom)} – ${formatMonthLabel(edition.monthKey)}`
  }

  return { formatDay, formatDateRange, formatMonthLabel, formatEditionLabel }
}
