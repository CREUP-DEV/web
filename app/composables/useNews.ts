export interface NewsItem {
  id: string
  image: string
  to: string
  title: string
  tagSlug: string | null
  tagName: string | null
  publishedAt: string
}

export interface NewsResponse {
  news: NewsItem[]
}

export function useNews(tagSlug: Ref<string | null> | string | null = null) {
  const { locale } = useI18n()

  const tagRef = typeof tagSlug === 'string' || tagSlug === null ? ref(tagSlug) : tagSlug

  return useAsyncData<NewsResponse>(
    () => `news-${tagRef.value || 'all'}`,
    () => {
      const params = new URLSearchParams()
      if (tagRef.value && tagRef.value !== 'all') {
        params.set('tag', tagRef.value)
      }
      params.set('limit', '4')
      return $fetch<NewsResponse>(`/api/news?${params.toString()}`)
    },
    {
      watch: [locale, tagRef],
    }
  )
}
