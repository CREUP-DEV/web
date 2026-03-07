/**
 * Sectoriales API endpoint
 * Proxies sectorial association data from the external CREUP intranet API.
 */

import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { externalSectorialMembersResponseSchema } from '../utils/validation'

const supportedNetworks = [
  'website',
  'email',
  'instagram',
  'twitter',
  'tiktok',
  'bluesky',
  'linkedin',
  'telegram',
  'discord',
  'facebook',
  'github',
] as const

type SupportedNetwork = (typeof supportedNetworks)[number]

interface SectorialSocialOutput {
  network: SupportedNetwork
  value: string
}

interface SectorialMemberOutput {
  id: string
  order: number
  denomination: string
  initials: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SectorialSocialOutput[]
}

const networkAliasMap: Record<string, SupportedNetwork> = {
  website: 'website',
  webpage: 'website',
  web: 'website',
  sitioweb: 'website',
  paginaweb: 'website',

  email: 'email',
  mail: 'email',
  correo: 'email',
  correoelectronico: 'email',
  contactemail: 'email',
  contact_email: 'email',

  instagram: 'instagram',

  twitter: 'twitter',
  x: 'twitter',
  twitterx: 'twitter',

  tiktok: 'tiktok',

  bluesky: 'bluesky',

  linkedin: 'linkedin',

  telegram: 'telegram',

  discord: 'discord',

  facebook: 'facebook',

  github: 'github',
}

const normalizeKey = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '')
}

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizeText = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeNetwork = (network: string): SupportedNetwork | null => {
  const normalized = normalizeKey(network)
  if (networkAliasMap[normalized]) {
    return networkAliasMap[normalized]
  }

  if (normalized.includes('correo') || normalized.includes('email')) {
    return 'email'
  }

  if (normalized.includes('web') || normalized.includes('pagina') || normalized.includes('sitio')) {
    return 'website'
  }

  return null
}

const inferNetwork = (networkValue: string, value: string): SupportedNetwork | null => {
  const inferred = normalizeNetwork(networkValue)
  if (inferred) {
    return inferred
  }

  if (emailPattern.test(value)) {
    return 'email'
  }

  return null
}

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
    `external-api:sectoriales:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/usuarios/sectoriales', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        console.error('Failed to fetch external sectoriales API:', error)
        throw createError({
          statusCode: 502,
          statusMessage: 'Sectoriales data is temporarily unavailable.',
        })
      }

      const parsedPayload = externalSectorialMembersResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error(
          'Invalid payload from external sectoriales API:',
          parsedPayload.error.flatten()
        )
        throw createError({
          statusCode: 502,
          statusMessage: 'Sectoriales data is temporarily unavailable.',
        })
      }

      const sectoriales: SectorialMemberOutput[] = parsedPayload.data.data.map((member, index) => {
        const socialMap = new Map<SupportedNetwork, string>()

        for (const socialNetwork of member.social_networks ?? []) {
          const value = normalizeText(socialNetwork.value)
          const network = inferNetwork(normalizeText(socialNetwork.network), value)

          if (!network || !value || socialMap.has(network)) {
            continue
          }

          socialMap.set(network, value)
        }

        const socialNetworks: SectorialSocialOutput[] = supportedNetworks.flatMap((network) => {
          const value = socialMap.get(network)
          if (!value) {
            return []
          }

          return [{ network, value }]
        })

        const denomination = normalizeText(member.denomination)
        const initials = normalizeText(member.initials)

        const identifierSeed = initials || denomination || `sectorial-${index + 1}`
        const rawIdentifier = `${member.order}-${identifierSeed}`
        const fallbackSlug = `sectorial-${index + 1}`
        const id = slugify(rawIdentifier) || fallbackSlug

        return {
          id,
          order: member.order,
          denomination,
          initials,
          description: normalizeText(member.description) || null,
          logoLight: toExternalImageProxyUrl(normalizeText(member.web_logo_light), {
            event,
            forceProxyRelative: true,
            publicPathBase: '/conocenos/imagenes',
          }),
          logoDark: toExternalImageProxyUrl(normalizeText(member.web_logo_dark), {
            event,
            forceProxyRelative: true,
            publicPathBase: '/conocenos/imagenes',
          }),
          socialNetworks,
        }
      })

      sectoriales.sort((a, b) => a.order - b.order)

      return {
        sectoriales,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
