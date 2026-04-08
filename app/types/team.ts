import type { SocialNetworkEntry } from '~~/shared/utils/social'

export type SocialNetwork = SocialNetworkEntry

export interface OrgMember {
  order: number
  denomination: string | null
  photo: string | null
  email: string
  name: string
  surname: string
  university: string | null
  degree: string | null
  description: string | null
  publicAgenda: boolean
  socialNetworks: SocialNetwork[]
}

export interface OrgArea {
  id: number
  name: string
  nameTranslations?: Record<string, string>
  order: number
  members: OrgMember[]
}

export interface OrgResponse {
  areas: OrgArea[]
  generatedAt?: string | null
}

export interface TeamMemberDetailResponse {
  member: EnrichedMember
}

export interface EnrichedMember extends OrgMember {
  areaName: string
  areaId: number
  isLeader: boolean
  slug: string
}
