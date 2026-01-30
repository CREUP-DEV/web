<script setup lang="ts">
/**
 * PublicAgenda
 * Displays a mini calendar with upcoming events from Google Calendar.
 * - Click on a day to see events (uses UPopover).
 * - Upcoming events listed below the calendar.
 * - Fixed-size date badges for consistent alignment.
 */
import { computed, ref } from 'vue'
import type { CalendarEvent } from '@/composables/useGoogleCalendar'

const props = defineProps<{
  events: CalendarEvent[]
  pending?: boolean
}>()

const { t, locale } = useI18n()

// Current date state
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())

// Selected day - use -1 to indicate no selection (avoids null issues)
const selectedDay = ref<number>(-1)
const isSelectingDay = ref(false)
const touchStartX = ref(0)
const touchStartY = ref(0)

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

const minMonthDate = computed(() => {
  const min = new Date(today)
  min.setMonth(min.getMonth() - 3)
  return new Date(min.getFullYear(), min.getMonth(), 1)
})

const maxMonthDate = computed(() => {
  const max = new Date(today)
  max.setMonth(max.getMonth() + 3)
  return new Date(max.getFullYear(), max.getMonth(), 1)
})

const canGoToPreviousMonth = computed(() => {
  const current = new Date(currentYear.value, currentMonth.value, 1)
  return current > minMonthDate.value
})

const canGoToNextMonth = computed(() => {
  const current = new Date(currentYear.value, currentMonth.value, 1)
  return current < maxMonthDate.value
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
const getEventsForDay = (day: number): CalendarEvent[] => {
  const dateStr = `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return props.events.filter((event) => event.date === dateStr)
}

// Upcoming events (next 4 events from today)
const upcomingEvents = computed(() => {
  const now = new Date()
  const bySeries = new Map<string, CalendarEvent>()

  for (const event of props.events) {
    const seriesId = event.seriesId || event.id
    const startDate = event.startDate || event.date
    const endDate = event.endDate || event.date
    const endDateTime = getEventEndDateTime(event, endDate)

    if (endDateTime.getTime() < now.getTime()) continue

    const existing = bySeries.get(seriesId)
    if (!existing) {
      bySeries.set(seriesId, {
        ...event,
        startDate,
        endDate,
      })
      continue
    }

    const existingStart = existing.startDate || existing.date
    const existingEnd = existing.endDate || existing.date

    if (startDate < existingStart) {
      existing.startDate = startDate
    }

    if (endDate > existingEnd) {
      existing.endDate = endDate
    }
  }

  return Array.from(bySeries.values())
    .sort((a, b) => (a.startDate || a.date).localeCompare(b.startDate || b.date))
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

const isMultiDayRange = (startDate: string, endDate?: string): boolean => {
  return Boolean(endDate && startDate !== endDate)
}

const formatUpcomingTime = (event: CalendarEvent): string => {
  if (event.isAllDay) return t('home.calendar.allDay')
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`
  return event.timeSlot
}

const getEventEndDateTime = (event: CalendarEvent, endDate: string): Date => {
  if (event.isAllDay) {
    return new Date(`${endDate}T23:59:59`)
  }

  if (event.endTime) {
    return new Date(`${endDate}T${event.endTime}`)
  }

  return new Date(`${endDate}T23:59:59`)
}

// Check if it's today
const isToday = (day: number): boolean => {
  return (
    day === today.getDate() &&
    currentMonth.value === today.getMonth() &&
    currentYear.value === today.getFullYear()
  )
}

// Handle day click
const onDayPointerDown = (day: number | null) => {
  if (day === null) return
  isSelectingDay.value = true
}

const onDayClick = (day: number | null) => {
  if (day === null) return

  // If clicking the same day, close the popover
  if (selectedDay.value === day) {
    selectedDay.value = -1
  } else {
    // Just change to the new day directly
    selectedDay.value = day
  }

  requestAnimationFrame(() => {
    isSelectingDay.value = false
  })
}

// Format date for display
const formatEventDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'es' ? 'es-ES' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

// Navigation
const goToPreviousMonth = () => {
  if (!canGoToPreviousMonth.value) return
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
  selectedDay.value = -1
}

const goToNextMonth = () => {
  if (!canGoToNextMonth.value) return
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
  selectedDay.value = -1
}

// Handle popover close - only reset if we're actually closing (not switching)
const onPopoverClose = (open: boolean, day: number | null) => {
  if (open || day === null || isSelectingDay.value) return
  if (selectedDay.value === day) {
    selectedDay.value = -1
  }
}

const onTouchStart = (event: TouchEvent) => {
  const touch = event.touches[0]
  if (!touch) return
  touchStartX.value = touch.clientX
  touchStartY.value = touch.clientY
}

const onTouchEnd = (event: TouchEvent) => {
  const touch = event.changedTouches[0]
  if (!touch) return

  const deltaX = touch.clientX - touchStartX.value
  const deltaY = touch.clientY - touchStartY.value
  const minDistance = 40

  if (Math.abs(deltaX) < minDistance || Math.abs(deltaX) < Math.abs(deltaY)) return

  if (deltaX < 0) {
    goToNextMonth()
  } else {
    goToPreviousMonth()
  }
}
</script>

<template>
  <section aria-labelledby="public-agenda-heading" class="h-full">
    <div
      class="bg-surface/50 flex h-full flex-col rounded-2xl p-4 ring-1 ring-gray-200/50 sm:p-5 dark:ring-gray-800/50"
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
          :disabled="!canGoToPreviousMonth"
          @click="goToPreviousMonth"
        />
        <span class="text-sm font-medium capitalize sm:text-base">{{ monthName }}</span>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-tabler-chevron-right"
          size="sm"
          :aria-label="t('home.calendar.nextMonth')"
          :disabled="!canGoToNextMonth"
          @click="goToNextMonth"
        />
      </div>

      <!-- Week days header -->
      <div class="text-muted mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium">
        <div v-for="(day, index) in weekDays" :key="`${locale}-${index}`" class="py-1">
          {{ day }}
        </div>
      </div>

      <!-- Calendar grid -->
      <div
        class="relative grid grid-cols-7 gap-1"
        role="grid"
        :aria-label="t('home.calendar.label')"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <UPopover
          v-for="(day, idx) in calendarDays"
          :key="idx"
          :open="day !== null && day === selectedDay"
          @update:open="(open) => onPopoverClose(open, day)"
        >
          <template #default="{ open }">
            <button
              type="button"
              :disabled="day === null"
              :aria-label="day ? `${day} ${monthName}` : undefined"
              :aria-expanded="open"
              class="focus-visible:ring-primary-500 relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2"
              :class="[
                day === null ? 'cursor-default' : 'hover:bg-muted cursor-pointer',
                day !== null && selectedDay === day ? 'ring-primary bg-primary/10 ring-2' : '',
                day !== null && isToday(day) && selectedDay === -1 && !isSelectingDay
                  ? 'ring-primary bg-primary/10 ring-2'
                  : '',
                day !== null && hasEvents(day) ? 'text-primary font-bold' : '',
              ]"
              @click="onDayClick(day)"
              @pointerdown="onDayPointerDown(day)"
            >
              <span v-if="day">{{ day }}</span>
            </button>
          </template>
          <template #content>
            <div class="max-w-72 min-w-56 p-3">
              <h3 class="text-muted mb-2 text-sm font-medium capitalize">
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
                  class="bg-surface rounded-lg p-2.5"
                >
                  <p class="text-foreground text-sm font-medium">
                    {{ event.title }}
                  </p>
                  <p class="text-muted mt-1 flex items-center gap-1 text-xs">
                    <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" />
                    <span>{{ event.timeSlot }}</span>
                  </p>
                </li>
              </ul>
              <p v-else class="text-muted text-sm">
                {{ t('home.calendar.noEvents') }}
              </p>
            </div>
          </template>
        </UPopover>
      </div>

      <!-- Upcoming events -->
      <div class="mt-4 flex-1">
        <h3 class="text-foreground mb-2 text-sm font-semibold">
          {{ t('home.calendar.upcomingEvents') }}
        </h3>
        <!-- Loading skeleton -->
        <ul v-if="pending" class="space-y-2" role="list" aria-hidden="true">
          <li v-for="n in 4" :key="n" class="bg-surface flex items-start gap-3 rounded-lg p-2.5">
            <USkeleton class="h-10 w-14 shrink-0 rounded" />
            <div class="min-h-10 min-w-0 flex-1 space-y-1">
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </li>
        </ul>
        <!-- Actual events -->
        <ul v-else-if="upcomingEvents.length > 0" class="space-y-2" role="list">
          <li
            v-for="(event, idx) in upcomingEvents"
            :key="idx"
            class="bg-surface flex items-start gap-3 rounded-lg p-2.5"
          >
            <!-- Fixed-width date badge for consistent alignment -->
            <div
              class="bg-primary/10 flex min-h-10 w-16 shrink-0 flex-col items-center justify-center rounded py-1 text-center"
            >
              <span class="text-primary text-xs leading-tight font-semibold">
                {{ formatShortDate(event.startDate || event.date) }}
              </span>
              <span
                v-if="isMultiDayRange(event.startDate || event.date, event.endDate || event.date)"
                class="text-primary text-xs leading-tight font-semibold"
              >
                {{ formatShortDate(event.endDate || event.date) }}
              </span>
            </div>
            <!-- Event details with fixed min-height for consistency -->
            <div class="min-h-10 min-w-0 flex-1">
              <p class="text-foreground line-clamp-2 text-sm leading-snug font-medium">
                {{ event.title }}
              </p>
              <p class="text-muted mt-0.5 flex items-center gap-1 text-xs">
                <UIcon name="i-tabler-clock" class="size-3.5 shrink-0" aria-hidden="true" />
                <span>{{ formatUpcomingTime(event) }}</span>
              </p>
            </div>
          </li>
        </ul>
        <p v-else class="text-muted text-sm">
          {{ t('home.calendar.noUpcomingEvents') }}
        </p>
      </div>
    </div>
  </section>
</template>
