import type { MaybeRefOrGetter } from 'vue'
import type { PressArticleType } from '@/composables/usePress'

export function usePressArchiveFilters(type: MaybeRefOrGetter<PressArticleType>) {
  const tags = useTags(type)

  const tagQuery = useSyncedQueryParam<string | null>('tag', {
    parse: (rawValue) => rawValue,
    serialize: (value) => value ?? null,
  })
  const page = useSyncedQueryParam<number>('page', {
    parse: (rawValue) => {
      const parsed = Number(rawValue)
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
    },
    serialize: (value) => (value > 1 ? String(Math.floor(value)) : null),
  })

  const availableTagSlugs = computed(() => new Set(tags.data.value?.tags.map((tag) => tag.slug)))
  const selectedTag = computed<string | null>(() => {
    const slug = tagQuery.value
    if (!slug) {
      return null
    }

    return availableTagSlugs.value.has(slug) ? slug : null
  })

  watch(tagQuery, () => {
    page.value = 1
  })

  watch(
    [tagQuery, tags.data, tags.pending],
    ([tag, tagsData, pendingTags]) => {
      if (!tag || pendingTags || !tagsData) {
        return
      }

      if (!availableTagSlugs.value.has(tag)) {
        tagQuery.value = null
        page.value = 1
      }
    },
    { immediate: true }
  )

  const selectTag = (tagSlug: string | null) => {
    tagQuery.value = tagSlug
    page.value = 1
  }

  return {
    page,
    selectTag,
    selectedTag,
    tagQuery,
    tagsData: tags.data,
    tagsPending: tags.pending,
  }
}
