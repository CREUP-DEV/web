/**
 * Events API endpoint
 * Proxies event data from the external CREUP intranet API.
 */

import { createError, defineEventHandler } from 'h3'
import { externalEventsResponseSchema } from '../utils/validation'

interface EventBannerOutput {
  url: string | null
}

interface EventDocumentOutput {
  order: number
  title: string | null
  url: string | null
}

interface EventOrganizationOutput {
  order: number
  name: string | null
  link: string | null
  logoLight: string | null
}

interface EventGalleryImageOutput {
  order: number
  url: string | null
}

interface EventOutput {
  id: number
  name: string
  slug: string
  type: string | null
  location: string | null
  description: string | null
  banner: EventBannerOutput
  startDate: string
  endDate: string | null
  documents: EventDocumentOutput[]
  organizers: EventOrganizationOutput[]
  venues: EventOrganizationOutput[]
  collaborators: EventOrganizationOutput[]
  galleryImages: EventGalleryImageOutput[]
  order: number
}

const normalizeText = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

const mapOrganization = (org: {
  order: number
  name?: string | null
  link?: string | null
  web_logo_light?: string | null
}): EventOrganizationOutput => ({
  order: org.order,
  name: normalizeText(org.name),
  link: normalizeText(org.link),
  logoLight: normalizeText(org.web_logo_light),
})

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const endpoint = new URL('/api/eventos', configuredBaseUrl).toString()

  let payload: unknown
  try {
    payload = await $fetch(endpoint)
  } catch (error) {
    console.error('Failed to fetch external events API:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Events data is temporarily unavailable.',
    })
  }

  const parsedPayload = externalEventsResponseSchema.safeParse(payload)
  if (!parsedPayload.success) {
    console.error('Invalid payload from external events API:', parsedPayload.error.flatten())
    throw createError({
      statusCode: 502,
      statusMessage: 'Events data is temporarily unavailable.',
    })
  }

  const events: EventOutput[] = parsedPayload.data.data
    .sort((a, b) => a.order - b.order)
    .map((ev) => ({
      id: ev.event_id,
      name: ev.event_name,
      slug: ev.event_slug,
      type: normalizeText(ev.event_type),
      location: normalizeText(ev.event_location),
      description: normalizeText(ev.event_description),
      banner: {
        url: normalizeText(ev.event_banner?.url),
      },
      startDate: ev.event_start_date,
      endDate: normalizeText(ev.event_end_date),
      documents: (ev.documents ?? [])
        .sort((a, b) => a.order - b.order)
        .map((doc) => ({
          order: doc.order,
          title: normalizeText(doc.title),
          url: normalizeText(doc.url),
        })),
      organizers: (ev.organizers ?? []).sort((a, b) => a.order - b.order).map(mapOrganization),
      venues: (ev.venues ?? []).sort((a, b) => a.order - b.order).map(mapOrganization),
      collaborators: (ev.collaborators ?? [])
        .sort((a, b) => a.order - b.order)
        .map(mapOrganization),
      galleryImages: (ev.gallery_images ?? [])
        .sort((a, b) => a.order - b.order)
        .map((img) => ({
          order: img.order,
          url: normalizeText(img.url),
        })),
      order: ev.order,
    }))

  return {
    events,
    generatedAt: parsedPayload.data.generated_at ?? null,
  }
})
