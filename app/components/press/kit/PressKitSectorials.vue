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
  <div class="space-y-6">
    <p class="leading-relaxed">{{ t('pressKit.sectorials.intro') }}</p>

    <PressKitAsyncState
      :pending="pending"
      :failed="failed"
      :error-title="t('members.sectoriales.loadError')"
      @retry="emit('retry')"
    >
      <template #skeleton>
        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <USkeleton v-for="n in 6" :key="n" class="h-20 rounded-xl" />
        </div>
      </template>

      <p v-if="tiles.length === 0" class="text-muted">
        {{ t('members.sectoriales.noSectoriales') }}
      </p>
      <ul
        v-else
        class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-2"
        :aria-label="t('pressKit.sections.sectorials')"
      >
        <li v-for="tile in tiles" :key="tile.id">
          <PressKitOrganizationTile
            :logo="tile.logo"
            :title="tile.title"
            :details="tile.details"
            :image-loading="imageLoading"
          />
        </li>
      </ul>
    </PressKitAsyncState>
  </div>
</template>
