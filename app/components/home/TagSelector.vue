<script setup lang="ts">
const { t } = useI18n()
const { data: tagsData, pending } = useTags()

const tagList = computed(() => {
  const availableTags = tagsData.value?.tags ?? []

  return [
    {
      slug: 'all',
      name: t('common.all'),
    },
    ...availableTags.filter((tag) => tag.slug !== 'all'),
  ]
})
const isLoading = computed(() => pending.value || tagsData.value == null)

const emit = defineEmits<{
  (e: 'select', tagSlug: string): void
}>()

const selectedSlug = ref<string>('all')

const onSelectTag = (slug: string) => {
  selectedSlug.value = slug
  emit('select', slug)
}

watch(
  tagList,
  (list: Array<{ slug: string; name: string }>) => {
    if (!list.find((tag: { slug: string }) => tag.slug === selectedSlug.value)) {
      onSelectTag('all')
    }
  },
  { immediate: true }
)
</script>

<template>
  <div class="w-full overflow-x-auto">
    <div
      class="flex flex-nowrap items-center gap-2 pb-2 sm:flex-wrap sm:gap-2 sm:pb-0"
      role="group"
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
          :aria-pressed="tag.slug === selectedSlug"
          type="button"
          @click="onSelectTag(tag.slug)"
        >
          {{ tag.name }}
        </UButton>
      </template>
    </div>
  </div>
</template>
