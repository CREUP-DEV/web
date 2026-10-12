<script setup lang="ts">
import type { PressKitTile } from '@/composables/press/usePressKitContent'

defineProps<{
  tiles: PressKitTile[]
  pending: boolean
  failed: boolean
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
</script>

<template>
  <PressKitAsyncState
    :pending="pending"
    :failed="failed"
    :error-title="t('members.loadError')"
    @retry="emit('retry')"
  >
    <template #skeleton>
      <USkeleton class="mb-6 h-5 w-2/3 rounded" />
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <USkeleton v-for="n in 9" :key="n" class="h-20 rounded-xl" />
      </div>
    </template>

    <p class="mb-6 leading-relaxed">
      {{ t('pressKit.members.intro', { count: tiles.length }) }}
    </p>

    <ul
      class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2"
      :aria-label="t('pressKit.sections.members')"
    >
      <li v-for="tile in tiles" :key="tile.id">
        <PressKitOrganizationTile
          :logo="tile.logo"
          :title="tile.title"
          :subtitle="tile.subtitle"
          :details="tile.details"
          :image-loading="imageLoading"
        />
      </li>
    </ul>
  </PressKitAsyncState>
</template>
