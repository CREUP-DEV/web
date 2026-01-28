<script setup lang="ts">
/**
 * PublicAgenda
 * Displays a mini calendar with upcoming events.
 * - Click on a day to see events (uses UPopover).
 * - Upcoming events listed below the calendar.
 * - Fixed-size date badges for consistent alignment.
 */
import { computed, ref, nextTick } from 'vue'
import type { MockDataEventItem } from '@/composables/useMockData'

const props = defineProps<{
  events: MockDataEventItem[]
}>()

const { t, locale } = useI18n()

// Current date state
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

// Selected day - use -1 to indicate no selection (avoids null issues)
const selectedDay = ref<number>(-1)

// Prevent rapid day switching on mobile
const isTransitioning = ref(false)

// Days of week labels
const weekDays = computed(() => {
  if (locale.value === 'es') {
    return ['L', 'M', 'X', 'J', 'V', 'S', 'D']
  }
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S']
})

// Month name
const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    month: 'long',
    year: 'numeric',
  })
})

// First day of month (0 = Sunday, adjust to Monday-first week)
const firstDayOfMonth = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay()
  // Convert Sunday (0) to 7 for Monday-first week
  return day === 0 ? 7 : day
})

// Days in current month
const daysInMonth = computed(() => {
  return new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
})

// Create calendar grid
const calendarDays = computed(() => {
  const days: (number | null)[] = []
  // Add empty slots for days before the 1st
  for (let i = 1; i < firstDayOfMonth.value; i++) {
    days.push(null)
  }
  // Add the days of the month
  for (let d = 1; d <= daysInMonth.value; d++) {
    days.push(d)
  }
  return days
})

// Check if a day has events
const hasEvents = (day: number): boolean => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return props.events.some((event) => event.date === dateStr)
}

// Get events for a specific day
const getEventsForDay = (day: number): MockDataEventItem[] => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return props.events.filter((event) => event.date === dateStr)
}

// Upcoming events (next 4 events from today)
const upcomingEvents = computed(() => {
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return props.events
    .filter((event) => event.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)
})

// Format date for upcoming events (shorter format)
const formatShortDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    day: 'numeric',
    month: 'short',
  })
}

// Check if it's today
const isToday = (day: number): boolean => {
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

// Handle day click with debounce to prevent mobile issues
const onDayClick = async (day: number | null) => {
  if (day === null || isTransitioning.value) return

  isTransitioning.value = true

  // If clicking the same day, close the popover
  if (selectedDay.value === day) {
    selectedDay.value = -1
  } else {
    // Close current popover first, then open new one
    selectedDay.value = -1
    await nextTick()
    // Small delay to ensure popover closes before opening new one
    await new Promise((resolve) => setTimeout(resolve, 50))
    selectedDay.value = day
  }

  // Reset transition lock after animation completes
  setTimeout(() => {
    isTransitioning.value = false
  }, 200)
}

// Format date for display
const formatEventDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// Navigation
const goToPreviousMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDay.value = -1
}

const goToNextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDay.value = -1
}

// Handle popover close
const onPopoverClose = (open: boolean) => {
  if (!open && !isTransitioning.value) {
    selectedDay.value = -1
  }
}
</script>

<template>
  <section aria-labelledby="public-agenda-heading" class="h-full">
    <div
      class="flex h-full flex-col rounded-2xl bg-white/5 p-4 ring-1 ring-black/5 sm:p-5 dark:bg-neutral-900/50"
    >
      <header class="mb-4 flex items-center justify-between">
        <h2 id="public-agenda-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.publicAgenda') }}
        </h2>
      </header>

      <!-- Calendar Navigation -->
      <div class="mb-3 flex items-center justify-between">
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-tabler-chevron-left"
          size="sm"
          :aria-label="t('home.calendar.previousMonth')"
          @click="goToPreviousMonth"
        />
        <span class="text-sm font-medium capitalize sm:text-base">{{ monthName }}</span>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-tabler-chevron-right"
          size="sm"
          :aria-label="t('home.calendar.nextMonth')"
          @click="goToNextMonth"
        />
      </div>

      <!-- Week days header -->
      <div
        class="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-500 dark:text-neutral-400"
      >
        <div v-for="day in weekDays" :key="day" class="py-1">{{ day }}</div>
      </div>

      <!-- Calendar grid -->
      <div
        class="relative grid grid-cols-7 gap-1"
        role="grid"
        :aria-label="t('home.calendar.label')"
      >
        <UPopover
          v-for="(day, idx) in calendarDays"
          :key="idx"
          :open="day !== null && day === selectedDay"
          @update:open="onPopoverClose"
        >
          <template #default="{ open }">
            <button
              type="button"
              :disabled="day === null"
              :aria-label="day ? `${day} ${monthName}` : undefined"
              :aria-expanded="open"
              class="focus-visible:ring-primary-500 relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2"
              :class="[
                day === null
                  ? 'cursor-default'
                  : 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800',
                day !== null && selectedDay === day
                  ? 'ring-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2'
                  : '',
                day !== null && isToday(day) && selectedDay < 0
                  ? 'ring-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2'
                  : '',
                day !== null && hasEvents(day) ? 'text-primary font-bold' : '',
              ]"
              @click="onDayClick(day)"
            >
              <span v-if="day">{{ day }}</span>
            </button>
          </template>
          <template #content>
            <div class="max-w-72 min-w-56 p-3">
              <h3
                class="mb-2 text-sm font-medium text-neutral-600 capitalize dark:text-neutral-300"
              >
                {{
                  day
                    ? formatEventDate(
                        `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                      )
                    : ''
                }}
              </h3>
              <ul v-if="day && getEventsForDay(day).length > 0" class="space-y-2">
                <li
                  v-for="(event, eventIdx) in getEventsForDay(day)"
                  :key="eventIdx"
                  class="rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/50"
                >
                  <p class="text-sm font-medium text-neutral-800 dark:text-neutral-100">
                    {{ event.title }}
                  </p>
                  <p
                    class="mt-1 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
                  >
                    <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" />
                    <span>{{ event.timeSlot }}</span>
                  </p>
                </li>
              </ul>
              <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
                {{ t('home.calendar.noEvents') }}
              </p>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Upcoming events -->
      <div class="mt-4 flex-1">
        <h3 class="mb-2 text-sm font-semibold text-neutral-700 dark:text-neutral-200">
          {{ t('home.calendar.upcomingEvents') }}
        </h3>
        <ul v-if="upcomingEvents.length > 0" class="space-y-2" role="list">
          <li
            v-for="(event, idx) in upcomingEvents"
            :key="idx"
            class="flex items-start gap-3 rounded-lg bg-neutral-50 p-2.5 dark:bg-neutral-800/50"
          >
            <!-- Fixed-width date badge for consistent alignment -->
            <div
              class="bg-primary-100 dark:bg-primary-900/50 w-14 shrink-0 rounded py-1 text-center"
            >
              <span class="text-primary-700 dark:text-primary-300 text-xs font-semibold">{{
                formatShortDate(event.date)
              }}</span>
            </div>
            <!-- Event details with fixed min-height for consistency -->
            <div class="min-h-10 min-w-0 flex-1">
              <p
                class="line-clamp-2 text-sm leading-snug font-medium text-neutral-800 dark:text-neutral-100"
              >
                {{ event.title }}
              </p>
              <p
                class="mt-0.5 flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400"
              >
                <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" aria-hidden="true" />
                <span>{{ event.timeSlot }}</span>
              </p>
            </div>
          </li>
        </ul>
        <p v-else class="text-sm text-neutral-500 dark:text-neutral-400">
          {{ t('home.calendar.noUpcomingEvents') }}
        </p>
      </div>
    </div>
  </section>
</template>
