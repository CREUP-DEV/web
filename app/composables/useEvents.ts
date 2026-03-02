/**
 * Composable for fetching and managing CREUP events data.
 */

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

export function useEvents() {
  const { data, error, status } = useFetch<EventsResponse>('/api/eventos')

  const events = computed(() => data.value?.events ?? [])

  /** Unique, non-null event types for filter UI */
  const eventTypes = computed(() => {
    const types = new Set<string>()
    for (const event of events.value) {
      if (event.type) types.add(event.type)
    }
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'es'))
  })

  /** Find a single event by slug */
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
