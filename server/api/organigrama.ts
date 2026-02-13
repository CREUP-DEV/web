/**
 * Organigrama (Org Chart) API endpoint
 * Proxies org-chart data from the external CREUP intranet API.
 */

import { createError, defineEventHandler } from 'h3'
import { externalOrganigramaResponseSchema } from '../utils/validation'

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

interface OrgMemberOutput {
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  socialNetworks: MemberSocialOutput[]
}

interface OrgAreaOutput {
  id: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  members: OrgMemberOutput[]
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
  contact_email: 'email',
  contactemail: 'email',

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
    .replace(/[^a-z0-9]+/g, '')
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

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const endpoint = new URL('/api/organigrama', configuredBaseUrl).toString()

  let payload: unknown
  try {
    payload = await $fetch(endpoint)
  } catch (error) {
    console.error('Failed to fetch external organigrama API:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Organigrama data is temporarily unavailable.',
    })
  }

  const parsedPayload = externalOrganigramaResponseSchema.safeParse(payload)
  if (!parsedPayload.success) {
    console.error('Invalid payload from external organigrama API:', parsedPayload.error.flatten())
    throw createError({
      statusCode: 502,
      statusMessage: 'Organigrama data is temporarily unavailable.',
    })
  }

  const areas: OrgAreaOutput[] = parsedPayload.data.data
    .sort((a, b) => a.area_order - b.area_order)
    .map((area) => {
      const members: OrgMemberOutput[] = area.members
        .sort((a, b) => a.order - b.order)
        .map((member) => {
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

          return {
            order: member.order,
            denomination: normalizeText(member.denomination) || null,
            photo: normalizeText(member.web_photo) || null,
            email: normalizeText(member.email) || '',
            name: normalizeText(member.name) || '',
            surname: normalizeText(member.surname) || '',
            university: normalizeText(member.university) || null,
            degree: normalizeText(member.degree) || null,
            description: normalizeText(member.description) || null,
            socialNetworks,
          }
        })

      const nameTranslations: Record<string, string> = {}
      for (const [locale, translation] of Object.entries(area.area_name_translations ?? {})) {
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

  return {
    areas,
    generatedAt: parsedPayload.data.generated_at ?? null,
  }
})
