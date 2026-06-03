<script setup lang="ts">
import type { CREUPEventListItem } from '@/composables/events/useEvents'
import { getEventTypeI18nKey } from '~~/shared/constants/eventTypes'

const { t } = useI18n()
const localePath = useLocalePath()
const {
  formatDateRange: formatDateRangeText,
  isDateRangeOngoing,
  isDateRangeUpcoming,
} = useDatePresets()

const EVENTS_PAGE_SIZE = 12

usePageSeo('events.title', 'events.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.about.events'),
      path: localePath('/conocenos/eventos'),
    },
  ],
})

const typeParam = useSyncedQueryParam<string | null>('types', {
  parse: (rawValue) => rawValue,
  serialize: (value) => value ?? null,
})
const page = useSyncedQueryParam<number>('page', {
  parse: (rawValue) => {
    const parsed = Number(rawValue)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
  },
  serialize: (value) => (value > 1 ? String(Math.floor(value)) : null),
})
const offset = computed(() => (page.value - 1) * EVENTS_PAGE_SIZE)
const selectedTypes = computed<string[]>(() => {
  if (!typeParam.value) {
    return []
  }

  return typeParam.value
    .split(',')
    .map((eventType) => eventType.trim())
    .filter(Boolean)
})

const { events, eventTypes, total, pageCount, error, status, refresh } = useEvents({
  types: selectedTypes,
  limit: EVENTS_PAGE_SIZE,
  offset,
})

const eventsPending = computed(() => status.value === 'pending')
const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(eventsPending, events, error)

watch(selectedTypes, () => {
  page.value = 1
})

watch(
  [typeParam, eventTypes],
  ([types, availableTypes]) => {
    if (!types || availableTypes.length === 0) {
      return
    }

    const validTypes = types
      .split(',')
      .map((eventType) => eventType.trim())
      .filter((eventType) => eventType && availableTypes.includes(eventType))

    if (validTypes.length !== types.split(',').filter(Boolean).length) {
      typeParam.value = validTypes.length > 0 ? validTypes.join(',') : null
      page.value = 1
    }
  },
  { immediate: true }
)

watch(page, () => {
  nextTick(() => {
    if (resultsRef.value instanceof HTMLElement) {
      resultsRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

const toggleEventType = (eventType: string) => {
  const idx = selectedTypes.value.indexOf(eventType)
  if (idx >= 0) {
    const next = selectedTypes.value.filter((t) => t !== eventType)
    typeParam.value = next.length > 0 ? next.join(',') : null
  } else {
    typeParam.value = [...selectedTypes.value, eventType].join(',')
  }
}

const clearEventTypes = () => {
  typeParam.value = null
}

const getEventTypeLabel = (eventType: string | null) => {
  const key = getEventTypeI18nKey(eventType)
  return key ? t(key) : (eventType ?? '')
}

const formatDateRange = (event: CREUPEventListItem): string => {
  return formatDateRangeText(event.startDate, event.endDate, {
    includeYear: true,
  })
}

const isUpcoming = (event: CREUPEventListItem): boolean => {
  return isDateRangeUpcoming(event.startDate, event.endDate)
}

const isOngoing = (event: CREUPEventListItem): boolean => {
  return isDateRangeOngoing(event.startDate, event.endDate)
}

const getEntranceDelay = (index: number) => getEntranceDelayStyle(index, 70)
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-8">
      <header class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('events.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('events.description') }}
        </p>
      </header>

      <div v-if="error" class="space-y-3">
        <UAlert color="error" icon="i-tabler-alert-circle" :title="t('events.loadError')" />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
          {{ t('home.retry') }}
        </UButton>
      </div>

      <template v-else>
        <div v-if="isLoading" class="flex flex-wrap items-center gap-2" aria-hidden="true">
          <USkeleton
            v-for="n in 4"
            :key="`event-filter-skeleton-${n}`"
            class="h-8 w-24 rounded-full"
          />
        </div>

        <div
          v-else-if="eventTypes.length > 0"
          class="flex flex-wrap items-center gap-2"
          role="group"
          :aria-label="t('events.filterByType')"
        >
          <UButton
            type="button"
            size="sm"
            color="secondary"
            :variant="selectedTypes.length === 0 ? 'solid' : 'outline'"
            class="rounded-full"
            :aria-pressed="selectedTypes.length === 0"
            @click="clearEventTypes"
          >
            {{ t('events.allTypes') }}
          </UButton>
          <UButton
            v-for="eventType in eventTypes"
            :key="eventType"
            type="button"
            size="sm"
            color="secondary"
            :variant="selectedTypes.includes(eventType) ? 'solid' : 'outline'"
            class="rounded-full"
            :aria-pressed="selectedTypes.includes(eventType)"
            @click="toggleEventType(eventType)"
          >
            {{ getEventTypeLabel(eventType) }}
          </UButton>
        </div>

        <div ref="resultsRef" aria-live="polite" :aria-busy="eventsPending || undefined">
          <div
            v-if="isLoading"
            class="grid gap-6 sm:grid-cols-2"
            role="status"
            :aria-label="t('accessibility.loading')"
          >
            <div v-for="n in 6" :key="n" class="space-y-3">
              <USkeleton class="aspect-7/2 w-full rounded-lg" />
              <div class="space-y-2 px-1">
                <USkeleton class="h-3 w-20 rounded" />
                <USkeleton class="h-5 w-3/4 rounded" />
                <USkeleton class="h-3 w-40 rounded" />
              </div>
            </div>
          </div>

          <div v-else-if="events.length === 0" class="text-muted py-12 text-center">
            {{ t('events.noEvents') }}
          </div>

          <TransitionGroup
            v-else
            appear
            tag="div"
            name="stagger-list"
            class="grid gap-6 sm:grid-cols-2"
            :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
          >
            <NuxtLink
              v-for="(event, index) in events"
              :key="event.id"
              :to="localePath(`/conocenos/eventos/${event.slug}`)"
              class="group focus-visible:ring-primary block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              :style="getEntranceDelay(index)"
            >
              <UCard class="motion-card-subtle h-full">
                <template v-if="event.banner.url" #header>
                  <AdaptiveImage
                    :src="event.banner.url"
                    :alt="t('events.bannerAlt', { event: event.name })"
                    class="aspect-7/2 w-full object-cover"
                    loading="lazy"
                    width="700"
                    height="200"
                    format="webp"
                    quality="72"
                  />
                </template>

                <template v-else #header>
                  <div class="bg-muted flex aspect-7/2 items-center justify-center">
                    <UIcon name="i-tabler-calendar-event" class="text-muted size-12" />
                  </div>
                </template>

                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <UBadge v-if="isOngoing(event)" color="success" variant="soft" size="sm">
                      {{ t('events.ongoing') }}
                    </UBadge>
                    <UBadge v-else-if="isUpcoming(event)" color="info" variant="soft" size="sm">
                      {{ t('events.upcoming') }}
                    </UBadge>
                    <UBadge v-if="event.type" color="neutral" variant="soft" size="sm">
                      {{ getEventTypeLabel(event.type) }}
                    </UBadge>
                  </div>

                  <h2 class="text-base leading-snug font-semibold group-hover:underline">
                    {{ event.name }}
                  </h2>

                  <p class="text-muted text-sm">
                    <UIcon
                      name="i-tabler-calendar"
                      class="mr-1 inline-block size-4 align-text-bottom"
                    />
                    {{ formatDateRange(event) }}
                  </p>

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
          </TransitionGroup>
        </div>

        <nav
          v-if="pageCount > 1"
          class="flex justify-center pt-4"
          :aria-label="`${t('events.title')} - ${t('accessibility.paginationNavigation')}`"
        >
          <UPagination v-model:page="page" :total="total" :items-per-page="EVENTS_PAGE_SIZE" />
        </nav>
      </template>
    </article>
  </UContainer>
</template>
