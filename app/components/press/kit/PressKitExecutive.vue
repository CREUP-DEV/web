<script setup lang="ts">
import type { PressKitPerson } from '@/composables/press/usePressKitContent'

defineProps<{
  people: PressKitPerson[]
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
    <p class="leading-relaxed">{{ t('pressKit.executive.intro') }}</p>

    <PressKitAsyncState
      :pending="pending"
      :failed="failed"
      :error-title="t('team.loadError')"
      @retry="emit('retry')"
    >
      <template #skeleton>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <USkeleton v-for="n in 6" :key="n" class="h-64 rounded-xl" />
        </div>
      </template>

      <ul
        class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 print:gap-3"
        :aria-label="t('team.executiveCommission')"
      >
        <li v-for="person in people" :key="person.id">
          <PressKitPersonCard
            :name="person.name"
            :role="person.role"
            :photo="person.photo"
            :degree="person.degree"
            :university="person.university"
            :email="person.email"
            :image-loading="imageLoading"
          />
        </li>
      </ul>
    </PressKitAsyncState>
  </div>
</template>
