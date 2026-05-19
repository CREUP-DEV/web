import type { H3Event } from 'h3'
import { createError } from 'h3'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import {
  collectSocialNetworks,
  normalizeSocialText,
  type SocialNetworkEntry,
} from '~~/shared/utils/social'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { toExternalImageProxyUrlWithKindHint } from '../external/externalAssetKind'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from '../cache/externalApiCache'
import { logError } from '../core/logger'
import { getRequestLocaleContext } from '../locale/requestLocale'
import { getRequiredExternalApiBaseUrl } from '../core/runtimeConfig'
import {
  externalAssociatedMemberSchema,
  externalAssociatedMembersResponseSchema,
  externalOrganigramaAreaSchema,
  externalOrganigramaMemberSchema,
  externalOrganigramaResponseSchema,
  externalSectorialMemberSchema,
  externalSectorialMembersResponseSchema,
} from '../validation'

type ExternalAssociatedMember = ReturnType<typeof externalAssociatedMemberSchema.parse>
type ExternalSectorialMember = ReturnType<typeof externalSectorialMemberSchema.parse>
type ExternalOrganigramaArea = ReturnType<typeof externalOrganigramaAreaSchema.parse>
type ExternalOrganigramaMember = ReturnType<typeof externalOrganigramaMemberSchema.parse>

export interface PublicAssociatedMember {
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

export interface PublicSectorialMember {
  id: string
  order: number
  denomination: string
  initials: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SocialNetworkEntry[]
}

export interface PublicTeamMember {
  id: string
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  isCommitteeResponsible: boolean
  publicAgenda: boolean
  socialNetworks: SocialNetworkEntry[]
}

export interface PublicTeamArea {
  id: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  members: PublicTeamMember[]
}

export interface PublicTeamMemberDetail extends PublicTeamMember {
  areaId: number
  areaName: string
  isLeader: boolean
  slug: string
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

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeCommunity = (communityName: string) => {
  const normalized = normalizeKey(communityName)
  return communityAliasMap[normalized] ?? 'unknown'
}

const normalizeText = normalizeSocialText
const PUBLIC_MEMBERS_CACHE_VERSION = 2

const buildStableMemberSlug = (
  parts: Array<string | null | undefined>,
  fallbackPrefix: 'member' | 'sectorial',
  index: number
) => {
  const baseSlug = slugify(parts.filter(Boolean).join('-'))
  return baseSlug || `${fallbackPrefix}-${index + 1}`
}

const buildStablePersonId = (
  parts: Array<string | null | undefined>,
  fallbackPrefix = 'person',
  fallbackIndex = 0
) => {
  const baseId = slugify(parts.filter(Boolean).join('-'))
  return baseId || `${fallbackPrefix}-${fallbackIndex + 1}`
}

function buildPublicMembersCacheKey(event: H3Event, scope: string) {
  const configuredBaseUrl = getRequiredExternalApiBaseUrl(event)
  return {
    configuredBaseUrl,
    cacheKey: `external-api:${scope}:v${PUBLIC_MEMBERS_CACHE_VERSION}:${configuredBaseUrl}`,
  }
}

async function loadAssociatedMembers(event: H3Event) {
  const { configuredBaseUrl, cacheKey } = buildPublicMembersCacheKey(event, 'members')
  const cacheOptions = getExternalApiCacheOptions(event)

  return withExternalApiSWRCache(
    cacheKey,
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

      const externalMembers = parsedPayload.data.data
      const members: PublicAssociatedMember[] = await Promise.all(
        externalMembers.map(async (member: ExternalAssociatedMember, index: number) => {
          const socialNetworks = collectSocialNetworks(member.social_networks)

          const denomination = normalizeText(member.denomination)
          const initials = normalizeText(member.initials)
          const university = normalizeText(member.university)
          const autonomousCommunityName = normalizeText(member.autonomous_community)

          const slug = buildStableMemberSlug(
            [initials, denomination, university, autonomousCommunityName],
            'member',
            index
          )

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
            logoLight: await toExternalImageProxyUrlWithKindHint(
              normalizeText(member.web_logo_light),
              {
                event,
                forceProxyRelative: true,
                publicPathBase: '/conocenos/imagenes',
              }
            ),
            logoDark: await toExternalImageProxyUrlWithKindHint(
              normalizeText(member.web_logo_dark),
              {
                event,
                forceProxyRelative: true,
                publicPathBase: '/conocenos/imagenes',
              }
            ),
            socialNetworks,
          }
        })
      )

      members.sort((a, b) => a.order - b.order)

      return {
        members,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}

async function loadSectoriales(event: H3Event) {
  const { configuredBaseUrl, cacheKey } = buildPublicMembersCacheKey(event, 'sectoriales')
  const cacheOptions = getExternalApiCacheOptions(event)

  return withExternalApiSWRCache(
    cacheKey,
    async () => {
      const endpoint = new URL('/api/usuarios/sectoriales', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.sectoriales.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'sectorialUnavailable'),
        })
      }

      const parsedPayload = externalSectorialMembersResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.sectoriales.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'sectorialUnavailable'),
        })
      }

      const externalSectorialMembers = parsedPayload.data.data
      const sectoriales: PublicSectorialMember[] = await Promise.all(
        externalSectorialMembers.map(async (member: ExternalSectorialMember, index: number) => {
          const socialNetworks = collectSocialNetworks(member.social_networks)

          const denomination = normalizeText(member.denomination)
          const initials = normalizeText(member.initials)

          const id = buildStableMemberSlug(
            [initials, denomination, normalizeText(member.description)],
            'sectorial',
            index
          )

          return {
            id,
            order: member.order,
            denomination,
            initials,
            description: normalizeText(member.description) || null,
            logoLight: await toExternalImageProxyUrlWithKindHint(
              normalizeText(member.web_logo_light),
              {
                event,
                forceProxyRelative: true,
                publicPathBase: '/conocenos/imagenes',
              }
            ),
            logoDark: await toExternalImageProxyUrlWithKindHint(
              normalizeText(member.web_logo_dark),
              {
                event,
                forceProxyRelative: true,
                publicPathBase: '/conocenos/imagenes',
              }
            ),
            socialNetworks,
          }
        })
      )

      sectoriales.sort((a, b) => a.order - b.order)

      return {
        sectoriales,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}

async function loadTeamAreas(event: H3Event) {
  const { configuredBaseUrl, cacheKey } = buildPublicMembersCacheKey(event, 'organigrama')
  const cacheOptions = getExternalApiCacheOptions(event)

  return withExternalApiSWRCache(
    cacheKey,
    async () => {
      const endpoint = new URL('/api/organigrama', configuredBaseUrl).toString()

      let payload: unknown
      try {
        payload = await $fetch(endpoint)
      } catch (error) {
        logError('external.organigrama.fetch', error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'orgChartUnavailable'),
        })
      }

      const parsedPayload = externalOrganigramaResponseSchema.safeParse(payload)
      if (!parsedPayload.success) {
        logError('external.organigrama.invalid-payload', parsedPayload.error, { endpoint }, event)
        throw createError({
          statusCode: 502,
          message: getPublicApiErrorMessage(event, 'orgChartUnavailable'),
        })
      }

      const externalAreas = parsedPayload.data.data
      const areas: PublicTeamArea[] = await Promise.all(
        externalAreas
          .sort(
            (a: ExternalOrganigramaArea, b: ExternalOrganigramaArea) => a.area_order - b.area_order
          )
          .map(async (area: ExternalOrganigramaArea) => {
            const members: PublicTeamMember[] = await Promise.all(
              area.members
                .sort(
                  (a: ExternalOrganigramaMember, b: ExternalOrganigramaMember) => a.order - b.order
                )
                .map(async (member: ExternalOrganigramaMember) => {
                  const socialNetworks = collectSocialNetworks(member.social_networks)
                  const normalizedDenomination = normalizeText(member.denomination) || null
                  const normalizedEmail = normalizeText(member.email) || ''
                  const normalizedName = normalizeText(member.name) || ''
                  const normalizedSurname = normalizeText(member.surname) || ''
                  const normalizedUniversity = normalizeText(member.university) || null

                  return {
                    id: buildStablePersonId(
                      [
                        normalizedEmail,
                        normalizedName,
                        normalizedSurname,
                        normalizedDenomination,
                        normalizedUniversity,
                      ],
                      'team-member',
                      member.order
                    ),
                    order: member.order,
                    denomination: normalizedDenomination,
                    photo: await toExternalImageProxyUrlWithKindHint(
                      normalizeText(member.web_photo),
                      {
                        event,
                        forceProxyRelative: true,
                        publicPathBase: '/conocenos/imagenes',
                      }
                    ),
                    email: normalizedEmail,
                    name: normalizedName,
                    surname: normalizedSurname,
                    university: normalizedUniversity,
                    degree: normalizeText(member.degree) || null,
                    description: normalizeText(member.description) || null,
                    isCommitteeResponsible: member.is_committee_responsible ?? false,
                    publicAgenda: member.public_agenda ?? false,
                    socialNetworks,
                  }
                })
            )
            const nameTranslations: Record<string, string> = {}
            for (const [locale, translation] of Object.entries(
              area.area_name_translations ?? {}
            ) as Array<[string, string]>) {
              const normalizedLocale = normalizeText(locale)
              const normalizedTranslation = normalizeText(translation)

              if (!normalizedLocale || !normalizedTranslation) {
                continue
              }

              nameTranslations[normalizedLocale] = normalizedTranslation
            }

            if (!nameTranslations.es) {
              nameTranslations.es = area.area_name
            }

            return {
              id: area.area_id,
              name: area.area_name,
              nameTranslations,
              order: area.area_order,
              members,
            }
          })
      )

      return {
        areas,
        generatedAt: parsedPayload.data.generated_at ?? null,
      }
    },
    cacheOptions
  )
}

export async function getAssociatedMembersResponse(event: H3Event) {
  return loadAssociatedMembers(event)
}

export async function getSectorialesResponse(event: H3Event) {
  return loadSectoriales(event)
}

export async function getTeamAreasResponse(event: H3Event) {
  return loadTeamAreas(event)
}

export async function getAssociatedMemberBySlug(event: H3Event, slug: string) {
  const response = await loadAssociatedMembers(event)
  return response.members.find((member) => member.slug === slug) ?? null
}

export async function getSectorialById(event: H3Event, id: string) {
  const response = await loadSectoriales(event)
  return response.sectoriales.find((sectorial) => sectorial.id === id) ?? null
}

export async function getTeamMemberBySlug(event: H3Event, slug: string) {
  const response = await loadTeamAreas(event)
  const { locale, fallbackLocale } = getRequestLocaleContext(event)

  for (const area of response.areas) {
    const member = area.members.find((entry) => {
      return (
        buildStablePersonId(
          [entry.email, entry.name, entry.surname, entry.denomination, entry.university],
          'team-member',
          entry.order
        ) === slug
      )
    })

    if (!member) {
      continue
    }

    const areaName =
      pickLocalizedValue(area.nameTranslations ?? {}, locale, fallbackLocale) ?? area.name

    return {
      ...member,
      areaId: area.id,
      areaName,
      isLeader: member.order === 0,
      slug,
    } satisfies PublicTeamMemberDetail
  }

  return null
}
