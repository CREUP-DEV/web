import { createError, defineEventHandler } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
  withExternalApiSWRCache,
} from '../utils/externalApiCache'
import { toExternalImageProxyUrl } from '../utils/externalAssetProxy'
import { getPublicApiErrorMessage } from '../utils/apiErrorMessages'
import { logError } from '../utils/logger'
import { getRequiredExternalApiBaseUrl } from '../utils/runtimeConfig'
import { externalAssociatedMembersResponseSchema } from '../utils/validation'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'

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
  socialNetworks: SocialNetworkEntry[]
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

const normalizeCommunity = (communityName: string) => {
  const normalized = normalizeKey(communityName)
  return communityAliasMap[normalized] ?? 'unknown'
}

const normalizeText = normalizeSocialText
export default defineEventHandler(async (event) => {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  return withExternalApiSWRCache(
    `external-api:members:${configuredBaseUrl}`,
    async () => {
      const endpoint = new URL('/api/usuarios/asociados', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.members.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'membersUnavailable'),
        })
      }

      const parsedPayload = externalAssociatedMembersResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.members.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'membersUnavailable'),
        })
      }

      const members: OrganizationMemberOutput[] = parsedPayload.data.data.map((member, index) => {
        const socialNetworks = collectSocialNetworks(member.social_networks)

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
