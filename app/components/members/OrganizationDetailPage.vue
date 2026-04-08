<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { OrganizationDetailModalData } from '@/types/members'

defineProps<{
  backTo: RouteLocationRaw
  title: string
  description?: string | null
  detailData: OrganizationDetailModalData
}>()

const emit = defineEmits<{
  (e: 'copy-email', email: string): void
}>()

const { t } = useI18n()
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <header class="mb-8 space-y-4 sm:mb-10">
      <UButton :to="backTo" variant="ghost" icon="i-tabler-arrow-left" size="sm">
        {{ t('common.back') }}
      </UButton>

      <div class="space-y-2">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ title }}</h1>
        <p v-if="description" class="text-muted max-w-3xl text-base sm:text-lg">
          {{ description }}
        </p>
      </div>
    </header>

    <MembersOrganizationDetailModal v-bind="detailData" @copy-email="emit('copy-email', $event)" />
  </UContainer>
</template>
