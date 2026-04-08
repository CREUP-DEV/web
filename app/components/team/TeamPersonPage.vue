<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'
import type { EnrichedMember } from '@/types/team'

defineProps<{
  member: EnrichedMember
  displayName: string
  backTo: RouteLocationRaw
  copyEmailAriaLabel: string
  contactEmail: string
  publicAgendaAriaLabel: string
}>()

const emit = defineEmits<{
  (e: 'copy-email', email: string): void
  (e: 'open-agenda'): void
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
        <h1 class="text-3xl font-bold sm:text-4xl">{{ displayName }}</h1>
        <p class="text-muted max-w-3xl text-base sm:text-lg">
          {{ member.denomination || member.areaName }}
        </p>
      </div>
    </header>

    <TeamPersonModal
      :member="member"
      :display-name="displayName"
      :badge-label="member.areaName"
      :contact-email="contactEmail"
      :copy-email-aria-label="copyEmailAriaLabel"
      @copy-email="emit('copy-email', $event)"
    />

    <div v-if="member.publicAgenda" class="mt-6 flex justify-center">
      <UButton
        variant="soft"
        icon="i-tabler-calendar"
        :aria-label="publicAgendaAriaLabel"
        @click="emit('open-agenda')"
      >
        {{ t('team.publicAgenda') }}
      </UButton>
    </div>
  </UContainer>
</template>
