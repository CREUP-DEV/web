<script setup lang="ts">
/**
 * TagSelector
 * Horizontal scrollable tag filter buttons.
 * Allows filtering news/content by category.
 */
const { t } = useI18n()
const { data: tagsData, pending } = useTags()

const tagList = computed(() => tagsData.value?.tags ?? [])
const isLoading = computed(() => pending.value || tagsData.value == null)

const emit = defineEmits<{
  (e: 'select', tagSlug: string): void
}>()

const selectedSlug = ref<string>('all')

const onSelectTag = (slug: string) => {
  selectedSlug.value = slug
  emit('select', slug)
}

// Move all logic to client mount (avoids SSR/Hydration discrepancies)
onMounted(() => {
  watch(
    tagList,
    (list: Array<{ slug: string; name: string }>) => {
      if (!list.length) {
        selectedSlug.value = 'all'
        return
      }
      // Default to first tag (which should be "all")
      if (!list.find((tag: { slug: string }) => tag.slug === selectedSlug.value)) {
        selectedSlug.value = list[0]?.slug ?? 'all'
      }
    },
    { immediate: true }
  )
})
</script>

<template>
  <div class="w-full overflow-x-auto">
    <div
      class="flex flex-nowrap items-center gap-2 pb-2 sm:flex-wrap sm:gap-2 sm:pb-0"
      role="tablist"
      :aria-label="t('home.latestNews')"
    >
      <template v-if="isLoading">
        <USkeleton v-for="n in 5" :key="n" class="h-8 w-20 rounded-full" aria-hidden="true" />
      </template>
      <template v-else>
        <UButton
          v-for="tag in tagList"
          :key="tag.slug"
          class="shrink-0 rounded-full whitespace-nowrap"
          size="sm"
          color="secondary"
          :variant="tag.slug === selectedSlug ? 'solid' : 'outline'"
          role="tab"
          :aria-selected="tag.slug === selectedSlug"
          :tabindex="tag.slug === selectedSlug ? 0 : -1"
          type="button"
          @click="onSelectTag(tag.slug)"
        >
          {{ tag.name }}
        </UButton>
      </template>
    </div>
  </div>
</template>
