/**
 * Events API endpoint
 * Proxies event data from the external CREUP intranet API.
 */

import type { H3Event } from 'h3'
import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../utils/externalAssetProxy'
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

const mapOrganization = (
  org: {
    order: number
    name?: string | null
    link?: string | null
    web_logo_light?: string | null
  },
  event: H3Event
): EventOrganizationOutput => ({
  order: org.order,
  name: normalizeText(org.name),
  link: normalizeText(org.link),
  logoLight: toExternalImageProxyUrl(normalizeText(org.web_logo_light), {
    event,
    forceProxyRelative: true,
    publicPathBase: '/eventos/imagenes',
  }),
})

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  return withExternalApiSWRCache(
    `external-api:eventos:${configuredBaseUrl}`,
    async () => {
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
            url: toExternalImageProxyUrl(normalizeText(ev.event_banner?.url), {
              event,
              forceProxyRelative: true,
              publicPathBase: '/eventos/imagenes',
            }),
          },
          startDate: ev.event_start_date,
          endDate: normalizeText(ev.event_end_date),
          documents: (ev.documents ?? [])
            .sort((a, b) => a.order - b.order)
            .map((doc) => ({
              order: doc.order,
              title: normalizeText(doc.title),
              url: toExternalPdfProxyUrl(normalizeText(doc.url), {
                forceProxyRelative: true,
                publicPathBase: '/eventos/documentos',
              }),
            })),
          organizers: (ev.organizers ?? [])
            .sort((a, b) => a.order - b.order)
            .map((org) => mapOrganization(org, event)),
          venues: (ev.venues ?? [])
            .sort((a, b) => a.order - b.order)
            .map((org) => mapOrganization(org, event)),
          collaborators: (ev.collaborators ?? [])
            .sort((a, b) => a.order - b.order)
            .map((org) => mapOrganization(org, event)),
          galleryImages: (ev.gallery_images ?? [])
            .sort((a, b) => a.order - b.order)
            .map((img) => ({
              order: img.order,
              url: toExternalImageProxyUrl(normalizeText(img.url), {
                event,
                forceProxyRelative: true,
                publicPathBase: '/eventos/imagenes',
              }),
            })),
          order: ev.order,
        }))

      return {
        events,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
