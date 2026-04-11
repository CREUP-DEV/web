import type { MaybeRef } from 'vue'
import type { PressArticleType } from '~~/shared/constants/pressTypes'

export type { PressArticleType }

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
  image: string | null
  pdfUrl: string | null
  externalUrl: string | null
  title: string
  description: string
  alt: string
  contentHtml?: string | null
  publishedAt: string
  updatedAt?: string | null
  /** Locale codes (e.g. 'es', 'en') for which a native translation exists in the database. */
  translatedLocales?: string[]
  tags: PressArticleTag[]
  mediaOutlet: PressArticleMediaOutlet | null
}

export interface PressResponse {
  items: PressArticle[]
  total: number
}

export interface PressDetailResponse {
  article: PressArticle | null
}

export function usePress(
  type?: MaybeRef<PressArticleType | null | undefined>,
  tagSlug?: MaybeRef<string | null | undefined>,
  limit?: MaybeRef<number | undefined>,
  offset?: MaybeRef<number | undefined>,
  options?: {
    enabled?: MaybeRef<boolean | undefined>
  }
) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()

  const typeValue = computed(() => unref(type) ?? null)
  const tagValue = computed(() => unref(tagSlug) ?? null)
  const limitValue = computed(() => {
    const value = unref(limit)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return undefined
  })
  const offsetValue = computed(() => {
    const value = unref(offset)
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value)
    }

    return 0
  })
  const enabledValue = computed(() => unref(options?.enabled) !== false)

  const pressKey = computed(() => {
    return `press-${locale.value}-${typeValue.value || 'all'}-${tagValue.value || 'none'}-${limitValue.value ?? 'all'}-${offsetValue.value}`
  })

  return useAsyncData<PressResponse>(
    pressKey,
    () => {
      if (!enabledValue.value) {
        return Promise.resolve({
          items: [],
          total: 0,
        })
      }

      const params = new URLSearchParams()
      if (typeValue.value) {
        params.set('type', typeValue.value)
      }
      if (tagValue.value) {
        params.set('tag', tagValue.value)
      }
      if (limitValue.value != null) {
        params.set('limit', String(limitValue.value))
      }
      if (offsetValue.value > 0) {
        params.set('offset', String(offsetValue.value))
      }
      return $fetch<PressResponse>(`/api/press?${params.toString()}`, {
        headers: localeApiHeaders.value,
      })
    },
    {
      default: () => ({
        items: [],
        total: 0,
      }),
      watch: [locale, typeValue, tagValue, limitValue, offsetValue, enabledValue],
    }
  )
}

export function usePressArticle(slug: string) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()
  const pressArticleKey = computed(() => `press-article-${slug}-${locale.value}`)

  return useAsyncData<PressDetailResponse>(
    pressArticleKey,
    () =>
      $fetch<PressDetailResponse>(`/api/press/${slug}`, {
        headers: localeApiHeaders.value,
      }),
    {
      default: () => ({ article: null }),
      watch: [locale],
    }
  )
}
