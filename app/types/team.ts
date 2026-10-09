import type { SocialNetworkEntry } from '~~/shared/utils/social'

export type SocialNetwork = SocialNetworkEntry

export interface OrgMember {
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
  socialNetworks: SocialNetwork[]
  /** Listed as a press contact in the press kit. */
  pressContact: boolean
  /** E.164 phone; the server only sends it for press contacts. */
  phone: string | null
}

export interface OrgArea {
  id: number
  name: string
  nameTranslations?: Record<string, string>
  order: number
  members: OrgMember[]
}

export interface OrgResponse {
  data: OrgArea[]
  meta: {
    generatedAt?: string | null
  }
}

export interface EnrichedMember extends OrgMember {
  areaName: string
  areaId: number
  isLeader: boolean
}
