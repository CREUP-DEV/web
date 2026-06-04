<script setup lang="ts">
import type { Tag } from '@/composables/press/useTags'

const props = defineProps<{
  tags: Tag[]
  pending?: boolean
  selectedSlugs: string[]
  ariaLabel?: string
}>()

const { t } = useI18n()

const tagList = computed(() => props.tags)

const isLoading = computed(() => props.pending ?? false)
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
  <div class="relative w-full">
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
    <!-- Scroll affordance: fade the right edge while the tag row scrolls horizontally (mobile only). -->
    <div
      aria-hidden="true"
      class="from-default pointer-events-none absolute inset-y-0 end-0 w-8 bg-gradient-to-l to-transparent sm:hidden"
    />
  </div>
</template>
