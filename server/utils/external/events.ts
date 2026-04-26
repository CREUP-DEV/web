import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from '../cache/externalApiCache'
import { toExternalImageProxyUrlWithKindHint } from './externalAssetKind'
import { toExternalPdfProxyUrl } from './externalAssetUrl'
import { logError } from '../core/logger'
import { getRequiredExternalApiBaseUrl } from '../core/runtimeConfig'
import { externalEventsResponseSchema } from '../validation'
import { EVENT_DOCUMENT_PUBLIC_BASE, EVENT_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

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

export interface EventOutput {
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

export interface EventsPayload {
  events: EventOutput[]
  generatedAt: string | null
}

const normalizeText = (value: string | null | undefined): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed || null
}

const getUrlOrigin = (value: string): string | null => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const toEventImageUrl = (
  source: string | null,
  event: H3Event,
  configuredBaseOrigin: string | null
): Promise<string | null> => {
  if (!source) {
    return Promise.resolve(null)
  }

  const sourceOrigin = getUrlOrigin(source)
  if (sourceOrigin && configuredBaseOrigin && sourceOrigin !== configuredBaseOrigin) {
    return Promise.resolve(source)
  }

  return toExternalImageProxyUrlWithKindHint(source, {
    event,
    forceProxyRelative: true,
    publicPathBase: EVENT_IMAGE_PUBLIC_BASE,
  })
}

const toEventPdfUrl = (
  source: string | null,
  configuredBaseOrigin: string | null
): string | null => {
  if (!source) {
    return null
  }

  const sourceOrigin = getUrlOrigin(source)
  if (sourceOrigin && configuredBaseOrigin && sourceOrigin !== configuredBaseOrigin) {
    return source
  }

  return toExternalPdfProxyUrl(source, {
    forceProxyRelative: true,
    publicPathBase: EVENT_DOCUMENT_PUBLIC_BASE,
  })
}

const mapOrganization = (
  organization: {
    order: number
    name?: string | null
    link?: string | null
    web_logo_light?: string | null
  },
  event: H3Event,
  configuredBaseOrigin: string | null
): Promise<EventOrganizationOutput> =>
  Promise.resolve({
    order: organization.order,
    name: normalizeText(organization.name),
    link: normalizeText(organization.link),
    logoLight: null,
  }).then(async (base) => ({
    ...base,
    logoLight: await toEventImageUrl(
      normalizeText(organization.web_logo_light),
      event,
      configuredBaseOrigin
    ),
  }))

export async function getEventsPayload(event: H3Event): Promise<EventsPayload> {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const configuredBaseOrigin = getUrlOrigin(configuredBaseUrl)
  const unavailableMessage = getPublicApiErrorMessage(event, 'eventsUnavailable')

  return withExternalApiSWRCache(
    `external-api:eventos:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/eventos', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.events.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: unavailableMessage,
        })
      }

      const parsedPayload = externalEventsResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.events.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: unavailableMessage,
        })
      }

      const events: EventOutput[] = await Promise.all(
        parsedPayload.data.data
          .sort((a, b) => a.order - b.order)
          .map(async (entry) => ({
            id: entry.event_id,
            name: entry.event_name,
            slug: entry.event_slug,
            type: normalizeText(entry.event_type),
            location: normalizeText(entry.event_location),
            description: normalizeText(entry.event_description),
            banner: {
              url: await toEventImageUrl(
                normalizeText(entry.event_banner?.url),
                event,
                configuredBaseOrigin
              ),
            },
            startDate: entry.event_start_date,
            endDate: normalizeText(entry.event_end_date),
            documents: (entry.documents ?? [])
              .sort((a, b) => a.order - b.order)
              .map((document) => ({
                order: document.order,
                title: normalizeText(document.title),
                url: toEventPdfUrl(normalizeText(document.url), configuredBaseOrigin),
              })),
            organizers: await Promise.all(
              (entry.organizers ?? [])
                .sort((a, b) => a.order - b.order)
                .map((organization) => mapOrganization(organization, event, configuredBaseOrigin))
            ),
            venues: await Promise.all(
              (entry.venues ?? [])
                .sort((a, b) => a.order - b.order)
                .map((organization) => mapOrganization(organization, event, configuredBaseOrigin))
            ),
            collaborators: await Promise.all(
              (entry.collaborators ?? [])
                .sort((a, b) => a.order - b.order)
                .map((organization) => mapOrganization(organization, event, configuredBaseOrigin))
            ),
            galleryImages: await Promise.all(
              (entry.gallery_images ?? [])
                .sort((a, b) => a.order - b.order)
                .map(async (image) => ({
                  order: image.order,
                  url: await toEventImageUrl(normalizeText(image.url), event, configuredBaseOrigin),
                }))
            ),
            order: entry.order,
          }))
      )

      return {
        events,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    getExternalApiCacheOptions(event)
  )
}

export async function getEventBySlug(event: H3Event, slug: string) {
  const payload = await getEventsPayload(event)

  return {
    event: payload.events.find((entry) => entry.slug === slug) ?? null,
    generatedAt: payload.generatedAt,
  }
}
