<script setup lang="ts">
const props = defineProps<{
  type?: string
  selectedSlugs: string[]
  ariaLabel?: string
}>()

const { t } = useI18n()
const { data: tagsData, pending } = useTags(() => props.type)

const tagList = computed(() => {
  const availableTags = tagsData.value?.items ?? []
  return availableTags
})

const isLoading = computed(() => pending.value || tagsData.value == null)
const groupAriaLabel = computed(() => props.ariaLabel ?? t('home.latestNews'))

const emit = defineEmits<{
  (e: 'toggle', tagSlug: string | null): void
}>()

const isSelected = (slug: string) => props.selectedSlugs.includes(slug)

const onToggleAll = () => {
  emit('toggle', null)
}

const onToggleTag = (slug: string) => {
  emit('toggle', slug)
}
</script>

<template>
  <div class="w-full overflow-x-auto">
    <div
      class="flex flex-nowrap items-center gap-2 pb-2 sm:flex-wrap sm:gap-2 sm:pb-0"
      role="group"
      :aria-label="groupAriaLabel"
    >
      <template v-if="isLoading">
        <USkeleton v-for="n in 5" :key="n" class="h-8 w-20 rounded-full" aria-hidden="true" />
      </template>
      <template v-else>
        <UButton
          class="shrink-0 rounded-full whitespace-nowrap"
          size="sm"
          color="secondary"
          :variant="selectedSlugs.length === 0 ? 'solid' : 'outline'"
          :aria-pressed="selectedSlugs.length === 0"
          type="button"
          @click="onToggleAll"
        >
          {{ t('press.allTags') }}
        </UButton>
        <UButton
          v-for="tag in tagList"
          :key="tag.slug"
          class="shrink-0 rounded-full whitespace-nowrap"
          size="sm"
          color="secondary"
          :variant="isSelected(tag.slug) ? 'solid' : 'outline'"
          :aria-pressed="isSelected(tag.slug)"
          type="button"
          @click="onToggleTag(tag.slug)"
        >
          {{ tag.name }}
        </UButton>
      </template>
    </div>
  </div>
</template>
