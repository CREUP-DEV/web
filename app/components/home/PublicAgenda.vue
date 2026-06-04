<script setup lang="ts">
import { useSwipe } from '@vueuse/core'
import type { CalendarEvent } from '@/composables/events/useGoogleCalendar'
import { collectUpcomingCalendarSeries } from '@/composables/events/useCalendarEventSeries'

const props = defineProps<{
  events: CalendarEvent[]
  pending?: boolean
  error?: Error | null
}>()
const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const { currentLanguageTag, formatDate: formatLocaleDate } = useLocaleFormatting()
const { formatShortDate } = useDatePresets()

// Fix 2 — reactive today that updates at midnight
const today = ref(new Date())
const currentYear = ref(today.value.getFullYear())
const currentMonth = ref(today.value.getMonth())
let midnightUpdateTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  const msUntilMidnight = () => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime() - now.getTime()
  }
  const scheduleMidnightUpdate = () => {
    midnightUpdateTimer = setTimeout(() => {
      today.value = new Date()
      scheduleMidnightUpdate()
    }, msUntilMidnight())
  }
  scheduleMidnightUpdate()
})

onBeforeUnmount(() => {
  if (midnightUpdateTimer) {
    clearTimeout(midnightUpdateTimer)
  }
})

const selectedDay = ref<number>(-1)
const isSelectingDay = ref(false)

const currentDatePrefix = computed(
  () => `${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}-`
)

const weekDays = computed(() => {
  const formatter = new Intl.DateTimeFormat(currentLanguageTag.value, { weekday: 'narrow' })
  const monday = Date.UTC(2024, 0, 1)

  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(monday + index * 86400000))
  )
})

const monthName = computed(() => {
  const date = new Date(currentYear.value, currentMonth.value, 1)
  return formatLocaleDate(date, {
    month: 'long',
    year: 'numeric',
  })
})

const minMonthDate = computed(() => {
  return new Date(today.value.getFullYear(), today.value.getMonth() - 3, 1)
})

const maxMonthDate = computed(() => {
  return new Date(today.value.getFullYear(), today.value.getMonth() + 3, 1)
})

const canGoToPreviousMonth = computed(() => {
  const current = new Date(currentYear.value, currentMonth.value, 1)
  return current > minMonthDate.value
})

const canGoToNextMonth = computed(() => {
  const current = new Date(currentYear.value, currentMonth.value, 1)
  return current < maxMonthDate.value
})

const firstDayOfMonth = computed(() => {
  const day = new Date(currentYear.value, currentMonth.value, 1).getDay()
  return day === 0 ? 7 : day
})
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

const visibleMonthEvents = computed(() => {
  const monthPrefix = currentDatePrefix.value
  const eventsByDate = new Map<string, CalendarEvent[]>()

  for (const event of props.events) {
    if (!event.date.startsWith(monthPrefix)) continue

    const existing = eventsByDate.get(event.date)
    if (existing) {
      existing.push(event)
      continue
    }

    eventsByDate.set(event.date, [event])
  }

  return eventsByDate
})

const getDayDate = (day: number) => `${currentDatePrefix.value}${String(day).padStart(2, '0')}`

const hasEvents = (day: number): boolean => visibleMonthEvents.value.has(getDayDate(day))

const getEventsForDay = (day: number): CalendarEvent[] =>
  visibleMonthEvents.value.get(getDayDate(day)) ?? []

// Accessible day label: append the event count so days with events are perceivable without colour.
const getDayAriaLabel = (day: number): string => {
  const count = getEventsForDay(day).length
  if (count > 0) {
    return t('home.calendar.dayWithEvents', { day, month: monthName.value, count }, count)
  }
  return `${day} ${monthName.value}`
}

// Upcoming events (next 4 events from today)
const upcomingEvents = computed(() => {
  return collectUpcomingCalendarSeries(props.events, {
    limit: 4,
    allDayLabel: t('home.calendar.allDay'),
  })
})

const isMultiDayRange = (startDate: string, endDate?: string): boolean => {
  return Boolean(endDate && startDate !== endDate)
}

const formatUpcomingTime = (event: CalendarEvent): string => {
  if (event.isAllDay) return t('home.calendar.allDay')
  if (event.startTime && event.endTime) return `${event.startTime} - ${event.endTime}`
  return event.timeSlot
}

// Fix 2 — isToday uses today.value
const isToday = (day: number): boolean => {
  return (
    day === today.value.getDate() &&
    currentMonth.value === today.value.getMonth() &&
    currentYear.value === today.value.getFullYear()
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
  return formatLocaleDate(dateStr, {
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

// Fix 3 — useSwipe from VueUse replaces manual touch tracking
const calendarEl = ref<HTMLElement | null>(null)
useSwipe(calendarEl, {
  onSwipeEnd(_e, direction) {
    if (direction === 'left') goToNextMonth()
    else if (direction === 'right') goToPreviousMonth()
  },
  threshold: 40,
  passive: true,
})
</script>

<template>
  <section aria-labelledby="public-agenda-heading" class="h-full">
    <div class="bg-surface/50 ring-default flex h-full flex-col rounded-2xl p-4 ring-1 sm:p-5">
      <header class="mb-4 flex items-center justify-between">
        <h2 id="public-agenda-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.publicAgenda') }}
        </h2>
      </header>

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
        <!-- Fix 4 — aria-live so screen readers announce month changes -->
        <span aria-live="polite" class="text-sm font-medium capitalize sm:text-base">{{
          monthName
        }}</span>
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

      <div class="text-muted mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium">
        <div v-for="(day, index) in weekDays" :key="`${currentLanguageTag}-${index}`" class="py-1">
          {{ day }}
        </div>
      </div>

      <!-- Fix 3 — ref="calendarEl" for useSwipe; Fix 1 — null cells rendered as plain divs -->
      <div
        ref="calendarEl"
        class="relative grid grid-cols-7 gap-1"
        :aria-label="t('home.calendar.label')"
      >
        <!-- Fix 1 & 5 — null cells skip UPopover; stable keys for all cells -->
        <template
          v-for="(day, idx) in calendarDays"
          :key="day === null ? `empty-${idx}` : `day-${day}`"
        >
          <div
            v-if="day === null"
            aria-hidden="true"
            class="relative flex aspect-square items-center justify-center rounded-lg"
          />
          <UPopover
            v-else
            :open="day === selectedDay"
            @update:open="(open: boolean) => onPopoverClose(open, day)"
          >
            <template #default="{ open }">
              <button
                type="button"
                :aria-label="getDayAriaLabel(day)"
                :aria-expanded="open"
                class="focus-visible:ring-primary-500 relative flex aspect-square items-center justify-center rounded-lg text-sm transition-colors focus:outline-none focus-visible:ring-2"
                :class="[
                  'hover:bg-muted cursor-pointer',
                  selectedDay === day ? 'ring-primary bg-primary/10 ring-2' : '',
                  isToday(day) && selectedDay === -1 && !isSelectingDay
                    ? 'ring-primary bg-primary/10 ring-2'
                    : '',
                  hasEvents(day) ? 'text-primary font-bold' : '',
                ]"
                @click="onDayClick(day)"
                @pointerdown="onDayPointerDown(day)"
              >
                <span>{{ day }}</span>
                <!-- Non-colour (shape) marker so days with events are distinguishable without relying on the text colour. -->
                <span
                  v-if="hasEvents(day)"
                  aria-hidden="true"
                  class="bg-primary absolute bottom-1 size-1 rounded-full"
                />
              </button>
            </template>
            <template #content>
              <div class="max-w-72 min-w-56 p-3">
                <h3 class="text-muted mb-2 text-sm font-medium capitalize">
                  {{
                    formatEventDate(
                      `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    )
                  }}
                </h3>
                <ul v-if="getEventsForDay(day).length > 0" class="space-y-2">
                  <li
                    v-for="event in getEventsForDay(day)"
                    :key="event.id"
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
        </template>
      </div>

      <div class="mt-4 flex-1">
        <h3 class="text-foreground mb-2 text-sm font-semibold">
          {{ t('home.calendar.upcomingEvents') }}
        </h3>
        <ul v-if="pending" class="space-y-2" role="list" aria-hidden="true">
          <li v-for="n in 4" :key="n" class="bg-surface flex items-start gap-3 rounded-lg p-2.5">
            <USkeleton class="h-10 w-14 shrink-0 rounded" />
            <div class="min-h-10 min-w-0 flex-1 space-y-1">
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </li>
        </ul>
        <ul v-else-if="upcomingEvents.length > 0" class="space-y-2" role="list">
          <li
            v-for="event in upcomingEvents"
            :key="event.id"
            class="bg-surface flex items-start gap-3 rounded-lg p-2.5"
          >
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
        <div v-else-if="error" class="space-y-2">
          <p class="text-muted text-sm">
            {{ t('home.calendar.loadError') }}
          </p>
          <UButton variant="outline" color="neutral" size="xs" @click="emit('retry')">
            {{ t('home.retry') }}
          </UButton>
        </div>
        <p v-else class="text-muted text-sm">
          {{ t('home.calendar.noUpcomingEvents') }}
        </p>
      </div>
    </div>
  </section>
</template>
