<script setup lang="ts">
/**
 * TagSelector
 * Horizontal scrollable tag filter buttons.
 * Allows filtering news/content by category.
 */
const { t } = useI18n()
const { data: tagsData } = useTags()

const tagList = computed(() => tagsData.value?.tags ?? [])

const selectedIndex = ref<number>(-1)

const onSelectIndex = (idx: number) => {
  selectedIndex.value = idx
}

// Move all logic to client mount (avoids SSR/Hydration discrepancies)
onMounted(() => {
  watch(
    tagList,
    (list) => {
      if (!list.length) {
        selectedIndex.value = -1
        return
      }
      if (selectedIndex.value < 0 || selectedIndex.value >= list.length) {
        selectedIndex.value = 0
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
      <UButton
        v-for="(tag, idx) in tagList"
        :key="`${tag}-${idx}`"
        class="shrink-0 rounded-full whitespace-nowrap"
        size="sm"
        color="secondary"
        :variant="idx === selectedIndex ? 'solid' : 'outline'"
        role="tab"
        :aria-selected="idx === selectedIndex"
        :tabindex="idx === selectedIndex ? 0 : -1"
        type="button"
        @click="onSelectIndex(idx)"
      >
        {{ tag }}
      </UButton>
    </div>
  </div>
</template>
