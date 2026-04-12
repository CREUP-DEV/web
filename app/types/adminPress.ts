import type { PressArticleType } from '~~/shared/constants/pressTypes'

export interface PressTranslationAdmin {
  locale: string
  title: string
  description: string
  contentHtml: string
  alt: string
}

export interface PressTagTranslationAdmin {
  locale: string
  name: string
}

export interface PressTagAdmin {
  id: string
  slug: string
  translations: PressTagTranslationAdmin[]
}

export interface PressMediaOutletAdmin {
  id: string
  name: string
  website: string
  logo: string
}

export interface PressArticleTagAssignmentAdmin {
  id: string
  pressArticleId: string
  tagId: string
  tag: PressTagAdmin
}

export interface PressArticleAdmin {
  id: string
  type: PressArticleType
  slug: string
  image: string
  pdfUrl: string | null
  externalUrl: string | null
  mediaOutletId: string | null
  active: boolean
  publishedAt: string
  updatedAt: string
  translations: PressTranslationAdmin[]
  tags: PressArticleTagAssignmentAdmin[]
  mediaOutlet: PressMediaOutletAdmin | null
}

export interface AdminPressArticleDetailResponse {
  data: PressArticleAdmin
}
