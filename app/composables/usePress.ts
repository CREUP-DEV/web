/**
 * Composable for fetching press articles from the public API
 * Supports filtering by type and tag
 */

export type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

export interface PressArticleTag {
  slug: string
  name: string
}

export interface PressArticleMediaOutlet {
  name: string
  logo: string
  website: string
}

export interface PressArticle {
  id: string
  type: PressArticleType
  slug: string
  image: string
  pdfUrl: string | null
  externalUrl: string | null
  title: string
  description: string
  alt: string
  publishedAt: string
  tags: PressArticleTag[]
  mediaOutlet: PressArticleMediaOutlet | null
}

export interface PressResponse {
  articles: PressArticle[]
}

export interface PressDetailResponse {
  article: PressArticle
}

/**
 * Fetch a list of press articles, optionally filtered by type and tag
 */
export function usePress(
  type?: Ref<PressArticleType | null> | PressArticleType | null,
  tagSlug?: Ref<string | null> | string | null,
  limit?: number
) {
  const { locale } = useI18n()

  const typeRef = typeof type === 'string' || type === null || type === undefined ? ref(type) : type
  const tagRef =
    typeof tagSlug === 'string' || tagSlug === null || tagSlug === undefined
      ? ref(tagSlug)
      : tagSlug

  return useAsyncData<PressResponse>(
    `press-${unref(typeRef) || 'all'}-${unref(tagRef) || 'all'}`,
    () => {
      const params = new URLSearchParams()
      if (typeRef.value) {
        params.set('type', typeRef.value)
      }
      if (tagRef.value && tagRef.value !== 'all') {
        params.set('tag', tagRef.value)
      }
      if (limit) {
        params.set('limit', String(limit))
      }
      return $fetch<PressResponse>(`/api/press?${params.toString()}`)
    },
    {
      watch: [locale, typeRef, tagRef],
    }
  )
}

/**
 * Fetch a single press article by slug
 */
export function usePressArticle(slug: string) {
  const { locale } = useI18n()

  return useAsyncData<PressDetailResponse>(
    `press-article-${slug}`,
    () => $fetch<PressDetailResponse>(`/api/press/${slug}`),
    {
      watch: [locale],
    }
  )
}
