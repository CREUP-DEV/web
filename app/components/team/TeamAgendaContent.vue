<script setup lang="ts">
import { collectUpcomingCalendarSeries } from '@/composables/useCalendarEventSeries'
import type { CalendarEvent } from '@/composables/useGoogleCalendar'
import type { EnrichedMember } from '@/types/team'

const props = defineProps<{
  member: EnrichedMember
  events: CalendarEvent[]
  loading: boolean
  error?: boolean
  bodyClass: string
}>()

const { t } = useI18n()
const { getDisplayName: getMemberDisplayName } = usePersonHelpers()
const { formatShortDate } = useDatePresets()

const upcomingAgendaEvents = computed(() => {
  return collectUpcomingCalendarSeries(props.events, {
    limit: 8,
    allDayLabel: t('home.calendar.allDay'),
  })
})
</script>

<template>
  <div :class="bodyClass">
    <div class="flex items-center gap-3">
      <div class="ring-primary/20 size-12 overflow-hidden rounded-full ring-2">
        <NuxtImg
          v-if="member.photo"
          :src="member.photo"
          :alt="getMemberDisplayName(member)"
          class="size-full object-cover"
        />
        <div v-else class="bg-primary/10 text-primary flex size-full items-center justify-center">
          <UIcon name="i-tabler-user" class="size-6" aria-hidden="true" />
        </div>
      </div>
      <div>
        <p class="text-foreground font-semibold">{{ getMemberDisplayName(member) }}</p>
        <p v-if="member.denomination" class="text-muted text-sm">
          {{ member.denomination }}
        </p>
      </div>
    </div>

    <div aria-live="polite" :aria-busy="loading || undefined">
      <div v-if="loading" class="space-y-2">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-surface flex animate-pulse items-start gap-3 rounded-lg p-3"
          :style="{ animationDelay: `${(n - 1) * 150}ms` }"
        >
          <USkeleton class="h-10 w-16 shrink-0 rounded" />
          <div class="flex-1 space-y-1">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </div>
      </div>

      <div v-else-if="error" class="flex flex-col items-center py-6 text-center">
        <UIcon name="i-tabler-alert-triangle" class="text-error mb-2 size-10" />
        <p class="text-muted text-sm">{{ t('team.agendaLoadError') }}</p>
      </div>

      <ul v-else-if="upcomingAgendaEvents.length" class="space-y-2">
        <li
          v-for="(event, idx) in upcomingAgendaEvents"
          :key="idx"
          class="bg-surface flex items-start gap-3 rounded-lg p-3"
        >
          <div
            class="bg-primary/10 flex min-h-10 w-16 shrink-0 flex-col items-center justify-center rounded py-1 text-center"
          >
            <span class="text-primary text-xs leading-tight font-semibold">
              {{ formatShortDate(event.startDate || event.date) }}
            </span>
            <span
              v-if="event.endDate && event.startDate !== event.endDate"
              class="text-primary text-xs leading-tight font-semibold"
            >
              {{ formatShortDate(event.endDate) }}
            </span>
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-foreground line-clamp-2 text-sm font-medium">
              {{ event.title }}
            </p>
            <p class="text-muted mt-0.5 flex items-center gap-1 text-xs">
              <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" aria-hidden="true" />
              <span>{{ event.timeSlot }}</span>
            </p>
          </div>
        </li>
      </ul>

      <div v-else class="flex flex-col items-center py-6 text-center">
        <UIcon name="i-tabler-calendar-off" class="text-muted mb-2 size-10" />
        <p class="text-muted text-sm">{{ t('team.noEvents') }}</p>
      </div>
    </div>
  </div>
</template>
