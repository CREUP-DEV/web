import type { SocialNetworkEntry } from '~~/shared/utils/social'

export interface CommitteeMember {
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
  publicAgenda: boolean
  socialNetworks: SocialNetworkEntry[]
}

export interface Committee {
  id: number
  name: string
  nameTranslations: Record<string, string>
  description: string | null
  descriptionTranslations: Record<string, string>
  order: number
  /** The responsible (if any) first, then the other members. */
  members: CommitteeMember[]
}

export interface CommitteesResponse {
  data: Committee[]
  meta: {
    generatedAt?: string | null
  }
}
