import type { SocialNetworkEntry } from '~~/shared/utils/social'

export type SocialNetwork = SocialNetworkEntry

export interface OrganizationMember {
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
  socialNetworks: SocialNetwork[]
}

export interface MembersResponse {
  data: OrganizationMember[]
  meta: {
    generatedAt?: string | null
  }
}

export interface SectorialMember {
  id: string
  order: number
  denomination: string
  initials: string
  description: string | null
  logoLight: string | null
  logoDark: string | null
  socialNetworks: SocialNetwork[]
}

export interface SectorialesResponse {
  data: SectorialMember[]
  meta: {
    generatedAt?: string | null
  }
}

export interface SocialEntity {
  socialNetworks: SocialNetwork[]
  logoLight: string | null
  logoDark: string | null
}

export interface OrganizationDetailModalData {
  eyebrow: string
  heading: string
  aboutTitle: string
  imageAlt: string
  description: string | null
  initials: string | null
  communityLabel: string | null
  logoLight: string | null
  logoDark: string | null
  website: {
    href: string
    label: string
  } | null
  email: {
    href: string
    email: string
  } | null
  socialButtons: Array<{
    network: Exclude<SocialNetworkEntry['network'], 'website' | 'email'>
    href: string
  }>
}
