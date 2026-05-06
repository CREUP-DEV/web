import type { MaybeRef } from 'vue'

export interface EventBanner {
  url: string | null
}

export interface EventDocument {
  order: number
  title: string | null
  url: string | null
}

export interface EventOrganization {
  order: number
  name: string | null
  link: string | null
  logoLight: string | null
  logoDark: string | null
}

export interface EventGalleryImage {
  order: number
  url: string | null
}

export interface CREUPEvent {
  id: number
  name: string
  slug: string
  type: string | null
  location: string | null
  description: string | null
  banner: EventBanner
  startDate: string
  endDate: string | null
  documents: EventDocument[]
  organizers: EventOrganization[]
  venues: EventOrganization[]
  collaborators: EventOrganization[]
  galleryImages: EventGalleryImage[]
  order: number
}

interface EventsResponse {
  data: CREUPEvent[]
  meta: {
    eventTypes: string[]
    generatedAt: string | null
    total: number
  }
}

interface EventDetailResponse {
  data: CREUPEvent
  meta: {
    generatedAt: string | null
  }
}

export function useEvents(options?: {
  type?: MaybeRef<string | null | undefined>
  types?: MaybeRef<string[] | null | undefined>
  limit?: MaybeRef<number | undefined>
  offset?: MaybeRef<number | undefined>
}) {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()
  const localeApiHeaders = useLocaleApiHeaders()

  const typeValue = computed(() => unref(options?.type) ?? null)
  const typesValue = computed(() => unref(options?.types) ?? null)
  const limitValue = computed(() => {
    const value = unref(options?.limit)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return 12
  })
  const offsetValue = computed(() => {
    const value = unref(options?.offset)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return 0
  })

  const { data, error, status, refresh } = useFetch<EventsResponse>('/api/eventos', {
    headers: localeApiHeaders,
    query: computed(() => ({
      ...(typesValue.value && typesValue.value.length > 0
        ? { types: typesValue.value.join(',') }
        : { type: typeValue.value || undefined }),
      limit: limitValue.value,
      offset: offsetValue.value,
    })),
    watch: [locale, typeValue, typesValue, limitValue, offsetValue],
  })

  const events = computed(() => data.value?.data ?? [])
  const total = computed(() => data.value?.meta.total ?? 0)
  const pageCount = computed(() => Math.ceil(total.value / limitValue.value))

  const eventTypes = computed(() => {
    return [...(data.value?.meta.eventTypes ?? [])].sort((a, b) =>
      a.localeCompare(b, getLanguageTag(locale.value))
    )
  })

  const findBySlug = (slug: string) =>
    computed(() => events.value.find((e) => e.slug === slug) ?? null)

  return {
    events,
    eventTypes,
    total,
    pageCount,
    error,
    status,
    refresh,
    findBySlug,
  }
}

export function useEvent(slug: Ref<string> | string) {
  const slugRef = typeof slug === 'string' ? ref(slug) : slug
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()
  const key = computed(() => `event-${slugRef.value}-${locale.value}`)

  return useAsyncData<EventDetailResponse>(
    key,
    () =>
      $fetch<EventDetailResponse>(`/api/eventos/${slugRef.value}`, {
        headers: localeApiHeaders.value,
      }),
    {
      watch: [locale, slugRef],
    }
  )
}
