<script setup lang="ts">
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import type { EnrichedMember } from '@/types/team'
import TeamAgendaContent from './TeamAgendaContent.vue'

defineProps<{
  open: boolean
  member: EnrichedMember | null
  events: CalendarEvent[]
  loading: boolean
  error?: boolean
  bodyClass: string
  modalUi: { content: string }
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
}>()

const { t } = useI18n()
</script>

<template>
  <UModal
    :open="open"
    :ui="modalUi"
    :title="t('team.publicAgendaOf', { name: member?.name ?? '' })"
    :description="t('team.agendaModalDescription')"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <TeamAgendaContent
        v-if="member"
        :member="member"
        :events="events"
        :loading="loading"
        :error="error"
        :body-class="bodyClass"
      />
    </template>
  </UModal>
</template>
