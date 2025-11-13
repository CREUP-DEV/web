export interface TagsResponse {
  tags: string[]
}

export function useTags() {
  const { locale } = useI18n()

  return useAsyncData<TagsResponse>('tags', () => $fetch<TagsResponse>('/api/tags'), {
    watch: [locale],
  })
}
