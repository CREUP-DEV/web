import type { MaybeRefOrGetter } from 'vue'
import type { PressArticleType } from '@/composables/usePress'

export function usePressArchiveFilters(type: MaybeRefOrGetter<PressArticleType | null>) {
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

  const availableTagSlugs = computed(() => new Set(tags.data.value?.items.map((tag) => tag.slug)))

  const selectedTags = computed<string[]>(() => {
    const raw = tagQuery.value
    if (!raw) return []
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s && availableTagSlugs.value.has(s))
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

      const validSlugs = tag
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s && availableTagSlugs.value.has(s))

      if (validSlugs.length !== tag.split(',').filter(Boolean).length) {
        tagQuery.value = validSlugs.length > 0 ? validSlugs.join(',') : null
        page.value = 1
      }
    },
    { immediate: true }
  )

  const toggleTag = (tagSlug: string | null) => {
    if (!tagSlug) {
      tagQuery.value = null
      page.value = 1
      return
    }

    const current = selectedTags.value
    const idx = current.indexOf(tagSlug)
    const next = idx >= 0 ? current.filter((s) => s !== tagSlug) : [...current, tagSlug]
    tagQuery.value = next.length > 0 ? next.join(',') : null
    page.value = 1
  }

  return {
    page,
    toggleTag,
    selectedTags,
    tagQuery,
    tagsData: tags.data,
  }
}
