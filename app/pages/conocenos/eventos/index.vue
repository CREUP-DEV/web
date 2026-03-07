<script setup lang="ts">
/**
 * Events List Page
 * Displays CREUP events fetched from the external events API,
 * with optional filtering by event type.
 */

import type { CREUPEvent } from '~/composables/useEvents'

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate: formatLocaleDate } = useLocaleFormatting()

useSeoMeta({
  title: () => t('events.title'),
  description: () => t('events.description'),
  ogTitle: () => t('events.title'),
  ogDescription: () => t('events.description'),
})

// ============================================================================
// Data fetching
// ============================================================================

const { events, eventTypes, error, status } = useEvents()

// ============================================================================
// Filtering
// ============================================================================

const selectedType = ref<string | null>(null)

const typeOptions = computed(() => [
  { label: t('events.allTypes'), value: null },
  ...eventTypes.value.map((type) => ({ label: type, value: type })),
])

const filteredEvents = computed(() => {
  if (!selectedType.value) return events.value
  return events.value.filter((e) => e.type === selectedType.value)
})

// ============================================================================
// Date helpers
// ============================================================================

const formatShortDate = (dateStr: string): string => {
  return formatLocaleDate(`${dateStr}T00:00:00`, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateRange = (event: CREUPEvent): string => {
  const startStr = formatShortDate(event.startDate)
  if (!event.endDate) return startStr
  return `${startStr} — ${formatShortDate(event.endDate)}`
}

const isUpcoming = (event: CREUPEvent): boolean => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const endDate = event.endDate
    ? new Date(event.endDate + 'T00:00:00')
    : new Date(event.startDate + 'T00:00:00')
  return endDate >= now
}

const isOngoing = (event: CREUPEvent): boolean => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(event.startDate + 'T00:00:00')
  const end = event.endDate
    ? new Date(event.endDate + 'T00:00:00')
    : new Date(event.startDate + 'T00:00:00')
  return start <= now && now <= end
}
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-8">
      <!-- Header -->
      <header class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('events.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('events.description') }}
        </p>
      </header>

      <!-- Error state -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-tabler-alert-circle"
        :title="t('events.loadError')"
      />

      <!-- Loading state -->
      <div
        v-else-if="status === 'pending'"
        class="flex justify-center py-12"
        role="status"
        aria-live="polite"
      >
        <UIcon name="i-tabler-loader-2" class="text-muted size-8 animate-spin" aria-hidden="true" />
        <span class="sr-only">{{ t('accessibility.loading') }}</span>
      </div>

      <!-- Content -->
      <template v-else>
        <!-- Type filter -->
        <div
          v-if="eventTypes.length > 0"
          class="flex flex-wrap items-center gap-2"
          role="group"
          :aria-label="t('events.filterByType')"
        >
          <UBadge
            v-for="option in typeOptions"
            :key="option.value ?? 'all'"
            :color="selectedType === option.value ? 'primary' : 'neutral'"
            :variant="selectedType === option.value ? 'solid' : 'soft'"
            size="lg"
            class="cursor-pointer"
            role="radio"
            :aria-checked="selectedType === option.value"
            @click="selectedType = option.value"
          >
            {{ option.label }}
          </UBadge>
        </div>

        <!-- Empty state -->
        <div v-if="filteredEvents.length === 0" class="text-muted py-12 text-center">
          {{ t('events.noEvents') }}
        </div>

        <!-- Events grid -->
        <div v-else class="grid gap-6 sm:grid-cols-2">
          <NuxtLink
            v-for="event in filteredEvents"
            :key="event.id"
            :to="localePath(`/conocenos/eventos/${event.slug}`)"
            class="group focus-visible:ring-primary block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <UCard class="h-full transition-shadow group-hover:shadow-lg">
              <!-- Banner image -->
              <template v-if="event.banner.url" #header>
                <NuxtImg
                  :src="event.banner.url"
                  :alt="t('events.bannerAlt', { event: event.name })"
                  class="aspect-7/2 w-full object-cover"
                  loading="lazy"
                  width="700"
                  height="200"
                />
              </template>

              <!-- Placeholder when no banner -->
              <template v-else #header>
                <div class="bg-muted flex aspect-7/2 items-center justify-center">
                  <UIcon name="i-tabler-calendar-event" class="text-muted size-12" />
                </div>
              </template>

              <div class="space-y-2">
                <!-- Event status badge -->
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge v-if="isOngoing(event)" color="success" variant="soft" size="sm">
                    {{ t('events.ongoing') }}
                  </UBadge>
                  <UBadge v-else-if="isUpcoming(event)" color="info" variant="soft" size="sm">
                    {{ t('events.upcoming') }}
                  </UBadge>
                  <UBadge v-if="event.type" color="neutral" variant="soft" size="sm">
                    {{ event.type }}
                  </UBadge>
                </div>

                <!-- Event name -->
                <h2 class="text-base leading-snug font-semibold group-hover:underline">
                  {{ event.name }}
                </h2>

                <!-- Date range -->
                <p class="text-muted text-sm">
                  <UIcon
                    name="i-tabler-calendar"
                    class="mr-1 inline-block size-4 align-text-bottom"
                  />
                  {{ formatDateRange(event) }}
                </p>

                <!-- Location -->
                <p v-if="event.location" class="text-muted text-sm">
                  <UIcon
                    name="i-tabler-map-pin"
                    class="mr-1 inline-block size-4 align-text-bottom"
                  />
                  {{ event.location }}
                </p>
              </div>
            </UCard>
          </NuxtLink>
        </div>
      </template>
    </article>
  </UContainer>
</template>
