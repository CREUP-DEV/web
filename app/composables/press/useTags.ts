import type { MaybeRefOrGetter } from 'vue'

export interface Tag {
  slug: string
  name: string
}

export interface TagsResponse {
  data: Tag[]
}

export function useTags(type?: MaybeRefOrGetter<string | null | undefined>) {
  const { locale } = useI18n()
  const localeApiHeaders = useLocaleApiHeaders()
  const typeValue = computed(() => toValue(type) ?? null)

  const key = computed(() => `tags-${locale.value}-${typeValue.value || 'none'}`)

  return useAsyncData<TagsResponse>(
    key,
    () => {
      const params = new URLSearchParams()

      if (typeValue.value) {
        params.set('type', typeValue.value)
      }

      const query = params.toString()
      const requestUrl = query ? `/api/tags?${query}` : '/api/tags'

      return $fetch<TagsResponse>(requestUrl, {
        headers: localeApiHeaders.value,
      })
    },
    {
      default: () => ({
        data: [],
      }),
      watch: [locale, typeValue],
    }
  )
}
