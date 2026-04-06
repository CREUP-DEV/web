export interface Tag {
  slug: string
  name: string
}

export interface TagsResponse {
  tags: Tag[]
}

export function useTags() {
  const { locale } = useI18n()

  return useAsyncData<TagsResponse>('tags', () => $fetch<TagsResponse>('/api/tags'), {
    default: () => ({
      tags: [],
    }),
    watch: [locale],
  })
}
