/**
 * Members API endpoint
 * Proxies member data from the external CREUP intranet API.
 */

import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { externalAssociatedMembersResponseSchema } from '../utils/validation'

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

interface MemberSocialOutput {
  network: SupportedNetwork
  value: string
}

interface OrganizationMemberOutput {
  id: string
  slug: string
  order: number
  denomination: string
  initials: string
  university: string
  autonomousCommunity: string
  autonomousCommunityName: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: MemberSocialOutput[]
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

const communityAliasMap: Record<string, string> = {
  andalucia: 'andalucia',
  aragon: 'aragon',
  asturias: 'asturias',
  principadodeasturias: 'asturias',
  baleares: 'baleares',
  illesbalears: 'baleares',
  islasbaleares: 'baleares',
  balearicislands: 'baleares',
  canarias: 'canarias',
  canaryislands: 'canarias',
  cantabria: 'cantabria',
  castillalamancha: 'castilla-la-mancha',
  castillayleon: 'castilla-y-leon',
  castileandleon: 'castilla-y-leon',
  cataluna: 'cataluna',
  catalunya: 'cataluna',
  catalonia: 'cataluna',
  ceuta: 'ceuta',
  extremadura: 'extremadura',
  galicia: 'galicia',
  larioja: 'la-rioja',
  madrid: 'madrid',
  comunidadmadrid: 'madrid',
  comunidaddemadrid: 'madrid',
  melilla: 'melilla',
  murcia: 'murcia',
  regiondemurcia: 'murcia',
  navarra: 'navarra',
  comunidadforaldenavarra: 'navarra',
  navarre: 'navarra',
  paisvasco: 'pais-vasco',
  euskadi: 'pais-vasco',
  paisvascoeuskadi: 'pais-vasco',
  valencia: 'valencia',
  comunidadvalenciana: 'valencia',
  comunitatvalenciana: 'valencia',
  valenciancommunity: 'valencia',
}

const normalizeKey = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

const slugify = (value: string) => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const normalizeNetwork = (network: string): SupportedNetwork | null => {
  const normalized = normalizeKey(network)
  if (networkAliasMap[normalized]) {
    return networkAliasMap[normalized]
  }

  // Handle unexpected labels from upstream API (e.g. "Correo electrónico institucional")
  if (normalized.includes('correo') || normalized.includes('email')) {
    return 'email'
  }

  if (normalized.includes('web') || normalized.includes('pagina') || normalized.includes('sitio')) {
    return 'website'
  }

  return null
}

const normalizeCommunity = (communityName: string) => {
  const normalized = normalizeKey(communityName)
  return communityAliasMap[normalized] ?? 'unknown'
}

const normalizeText = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return ''
  }
  return value.trim()
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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
    `external-api:members:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/usuarios/asociados', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        console.error('Failed to fetch external members API:', error)
        throw createError({
          statusCode: 502,
          statusMessage: 'Members data is temporarily unavailable.',
        })
      }

      const parsedPayload = externalAssociatedMembersResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        console.error('Invalid payload from external members API:', parsedPayload.error.flatten())
        throw createError({
          statusCode: 502,
          statusMessage: 'Members data is temporarily unavailable.',
        })
      }

      const members: OrganizationMemberOutput[] = parsedPayload.data.data.map((member, index) => {
        const socialMap = new Map<SupportedNetwork, string>()

        for (const socialNetwork of member.social_networks ?? []) {
          const value = normalizeText(socialNetwork.value)
          const network = inferNetwork(normalizeText(socialNetwork.network), value)

          if (!network || !value || socialMap.has(network)) {
            continue
          }

          socialMap.set(network, value)
        }

        const socialNetworks: MemberSocialOutput[] = supportedNetworks.flatMap((network) => {
          const value = socialMap.get(network)
          if (!value) {
            return []
          }

          return [{ network, value }]
        })

        const denomination = normalizeText(member.denomination)
        const initials = normalizeText(member.initials)
        const university = normalizeText(member.university)
        const autonomousCommunityName = normalizeText(member.autonomous_community)

        const identifierSeed = initials || denomination || university || `member-${index + 1}`
        const rawIdentifier = `${member.order}-${identifierSeed}`
        const fallbackSlug = `member-${index + 1}`
        const slug = slugify(rawIdentifier) || fallbackSlug

        return {
          id: slug,
          slug,
          order: member.order,
          denomination,
          initials,
          university,
          autonomousCommunity: normalizeCommunity(autonomousCommunityName),
          autonomousCommunityName,
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

      members.sort((a, b) => a.order - b.order)

      return {
        members,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
})
