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
  events: CREUPEvent[]
  generatedAt: string | null
}

interface EventDetailResponse {
  event: CREUPEvent
  generatedAt: string | null
}

export function useEvents() {
  const { locale } = useI18n()
  const { getLanguageTag } = useLocales()
  const { data, error, status } = useFetch<EventsResponse>('/api/eventos')

  const events = computed(() => data.value?.events ?? [])

  const eventTypes = computed(() => {
    const types = new Set<string>()
    for (const event of events.value) {
      if (event.type) types.add(event.type)
    }
    return Array.from(types).sort((a, b) => a.localeCompare(b, getLanguageTag(locale.value)))
  })

  const findBySlug = (slug: string) =>
    computed(() => events.value.find((e) => e.slug === slug) ?? null)

  return {
    events,
    eventTypes,
    error,
    status,
    findBySlug,
  }
}

export function useEvent(slug: Ref<string> | string) {
  const slugRef = typeof slug === 'string' ? ref(slug) : slug
  const key = computed(() => `event-${slugRef.value}`)

  return useAsyncData<EventDetailResponse>(
    key,
    () => $fetch<EventDetailResponse>(`/api/eventos/${slugRef.value}`),
    {
      watch: [slugRef],
    }
  )
}
