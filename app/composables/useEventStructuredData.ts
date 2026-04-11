import type { MaybeRefOrGetter } from 'vue'
import type { CREUPEvent } from '@/composables/useEvents'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'
import { toAbsoluteUrl } from '~~/shared/utils/url'

export function useEventStructuredData(eventInput: MaybeRefOrGetter<CREUPEvent>) {
  const { t } = useI18n()
  const route = useRoute()
  const localePath = useLocalePath()
  const siteConfig = useSiteConfig()
  const event = computed(() => toValue(eventInput))

  const siteBaseUrl = computed(() => {
    const configuredSiteUrl = String(siteConfig.url ?? '').trim()
    return (configuredSiteUrl || 'https://www.creup.es').replace(/\/$/, '')
  })

  const eventUrl = computed(() => {
    return toAbsoluteUrl(route.path, siteBaseUrl.value) || undefined
  })

  const eventStructuredDataImages = computed(() => {
    return [event.value.banner.url, ...event.value.galleryImages.map((image) => image.url)]
      .map((image) => toAbsoluteUrl(image, siteBaseUrl.value))
      .filter((image): image is string => Boolean(image))
  })

  const eventStructuredDataOrganizers = computed(() => {
    const organizers = event.value.organizers
      .filter((organizer) => organizer.name)
      .map((organizer) => ({
        '@type': 'Organization',
        name: organizer.name,
        url: toAbsoluteUrl(organizer.link, siteBaseUrl.value) || undefined,
      }))

    if (organizers.length > 0) {
      return organizers
    }

    return siteConfig.name
      ? [
          {
            '@type': 'Organization',
            name: siteConfig.name,
            url: siteBaseUrl.value || undefined,
          },
        ]
      : []
  })

  useHead(
    computed(() => ({
      script: [
        {
          type: 'application/ld+json',
          innerHTML: serializeJsonForHtmlScript({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: event.value.name,
            description: event.value.description || undefined,
            startDate: event.value.startDate,
            endDate: event.value.endDate || undefined,
            eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            image: eventStructuredDataImages.value.length
              ? eventStructuredDataImages.value
              : undefined,
            location: event.value.location
              ? {
                  '@type': 'Place',
                  name: event.value.location,
                }
              : undefined,
            organizer: eventStructuredDataOrganizers.value,
            url: eventUrl.value,
          }),
        },
        {
          type: 'application/ld+json',
          innerHTML: serializeJsonForHtmlScript({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: siteConfig.name,
                item: siteBaseUrl.value || undefined,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: t('events.title'),
                item:
                  toAbsoluteUrl(localePath('/conocenos/eventos'), siteBaseUrl.value) || undefined,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: event.value.name,
                item: eventUrl.value,
              },
            ],
          }),
        },
      ],
    }))
  )
}
