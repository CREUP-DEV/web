/**
 * Shared utilities for fetching and transforming mandate data from the
 * external CREUP intranet API.
 */

import type { externalOrganigramaMemberSocialSchema } from './validation'
import { externalMandatesResponseSchema, externalMandateDetailResponseSchema } from './validation'

// ============================================================================
// Shared types
// ============================================================================

export const SUPPORTED_NETWORKS = [
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

export type SupportedNetwork = (typeof SUPPORTED_NETWORKS)[number]

export interface MandateInfoOutput {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

export interface MemberSocialOutput {
  network: SupportedNetwork
  value: string
}

export interface AssignmentMemberOutput {
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

export interface AssignmentOutput {
  id: number
  role: string | null
  order: number
  startDate: string
  endDate: string | null
  member: AssignmentMemberOutput
}

export interface AreaTermOutput {
  areaTermId: number
  areaId: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  assignments: AssignmentOutput[]
}

export interface MandateDetailOutput {
  mandate: MandateInfoOutput
  areas: AreaTermOutput[]
  generatedAt: string | null
}

// ============================================================================
// Network normalisation helpers
// ============================================================================

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

const normalizeKey = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const normalizeText = (value: string | null | undefined) => {
  if (typeof value !== 'string') return ''
  return value.trim()
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const normalizeNetwork = (network: string): SupportedNetwork | null => {
  const normalized = normalizeKey(network)
  if (networkAliasMap[normalized]) return networkAliasMap[normalized]!
  if (normalized.includes('correo') || normalized.includes('email')) return 'email'
  if (normalized.includes('web') || normalized.includes('pagina') || normalized.includes('sitio'))
    return 'website'
  return null
}

const inferNetwork = (networkValue: string, value: string): SupportedNetwork | null => {
  const inferred = normalizeNetwork(networkValue)
  if (inferred) return inferred
  if (emailPattern.test(value)) return 'email'
  return null
}

type ExternalMember = ReturnType<typeof externalOrganigramaMemberSocialSchema.parse>

const transformMemberSocials = (socialNetworks: ExternalMember[]): MemberSocialOutput[] => {
  const socialMap = new Map<SupportedNetwork, string>()

  for (const sn of socialNetworks ?? []) {
    const value = normalizeText(sn.value)
    const network = inferNetwork(normalizeText(sn.network), value)
    if (!network || !value || socialMap.has(network)) continue
    socialMap.set(network, value)
  }

  return SUPPORTED_NETWORKS.flatMap((network) => {
    const value = socialMap.get(network)
    if (!value) return []
    return [{ network, value }]
  })
}

// ============================================================================
// Public fetch helpers
// ============================================================================

/**
 * Fetches the mandates list from the external API and returns normalised
 * mandate summaries sorted newest-first.
 */
export async function fetchMandatesList(externalBaseUrl: string): Promise<MandateInfoOutput[]> {
  const endpoint = new URL('/api/organigrama/mandatos', externalBaseUrl).toString()

  let payload: unknown
  try {
    payload = await $fetch(endpoint)
  } catch (error) {
    console.error('Failed to fetch external mandates list:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandates data is temporarily unavailable.',
    })
  }

  const parsed = externalMandatesResponseSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('Invalid payload from external mandates API:', parsed.error.flatten())
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandates data is temporarily unavailable.',
    })
  }

  return parsed.data.data
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((m) => ({
      id: m.id,
      startDate: m.start_date,
      endDate: m.end_date,
      isCurrent: m.is_current,
    }))
}

/**
 * Fetches the full detail for a single mandate by its numeric ID from the
 * external API and returns a normalised response.
 */
export async function fetchMandateDetail(
  externalBaseUrl: string,
  mandateId: number
): Promise<MandateDetailOutput> {
  const endpoint = new URL(`/api/organigrama/mandatos/${mandateId}`, externalBaseUrl).toString()

  let payload: unknown
  try {
    payload = await $fetch(endpoint)
  } catch (error) {
    console.error(`Failed to fetch mandate detail for id ${mandateId}:`, error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandate detail data is temporarily unavailable.',
    })
  }

  const parsed = externalMandateDetailResponseSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('Invalid mandate detail payload:', parsed.error.flatten())
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandate detail data is temporarily unavailable.',
    })
  }

  const mandate: MandateInfoOutput = {
    id: parsed.data.mandate.id,
    startDate: parsed.data.mandate.start_date,
    endDate: parsed.data.mandate.end_date,
    isCurrent: parsed.data.mandate.is_current,
  }

  const areas: AreaTermOutput[] = parsed.data.data
    .sort((a, b) => a.area_order - b.area_order)
    .map((area) => {
      const nameTranslations: Record<string, string> = {}
      for (const [locale, translation] of Object.entries(area.area_name_translations ?? {})) {
        const nl = normalizeText(locale)
        const nt = normalizeText(translation)
        if (!nl || !nt) continue
        nameTranslations[nl] = nt
      }
      if (!nameTranslations.es) {
        nameTranslations.es = area.area_name
      }

      const assignments: AssignmentOutput[] = area.assignments
        .sort((a, b) => a.order - b.order || a.start_date.localeCompare(b.start_date))
        .map((assignment) => {
          const member = assignment.member
          return {
            id: assignment.id,
            role: assignment.role ?? null,
            order: assignment.order,
            startDate: assignment.start_date,
            endDate: assignment.end_date,
            member: {
              order: member.order,
              denomination: normalizeText(member.denomination) || null,
              photo: normalizeText(member.web_photo) || null,
              email: normalizeText(member.email) || '',
              name: normalizeText(member.name) || '',
              surname: normalizeText(member.surname) || '',
              university: normalizeText(member.university) || null,
              degree: normalizeText(member.degree) || null,
              description: normalizeText(member.description) || null,
              socialNetworks: transformMemberSocials(member.social_networks ?? []),
            },
          }
        })

      return {
        areaTermId: area.area_term_id,
        areaId: area.area_id,
        name: area.area_name,
        nameTranslations,
        order: area.area_order,
        assignments,
      }
    })

  return {
    mandate,
    areas,
    generatedAt: parsed.data.generated_at ?? null,
  }
}
