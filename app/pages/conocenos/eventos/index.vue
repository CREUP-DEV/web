<script setup lang="ts">
import type { CREUPEvent } from '@/composables/useEvents'

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
      name: t('nav.events.label'),
      path: localePath('/conocenos/eventos'),
    },
  ],
})

const selectedType = ref<string | null>(null)
const page = ref(1)
const offset = computed(() => (page.value - 1) * EVENTS_PAGE_SIZE)

const { events, eventTypes, total, pageCount, error, status, refresh } = useEvents({
  type: selectedType,
  limit: EVENTS_PAGE_SIZE,
  offset,
})

watch(selectedType, () => {
  page.value = 1
})

const typeOptions = computed(() => [
  { label: t('events.allTypes'), value: null },
  ...eventTypes.value.map((type) => ({ label: type, value: type })),
])

const formatDateRange = (event: CREUPEvent): string => {
  return formatDateRangeText(event.startDate, event.endDate, {
    includeYear: true,
  })
}

const isUpcoming = (event: CREUPEvent): boolean => {
  return isDateRangeUpcoming(event.startDate, event.endDate)
}

const isOngoing = (event: CREUPEvent): boolean => {
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

      <div
        v-else-if="status === 'pending'"
        class="grid gap-6 sm:grid-cols-2"
        role="status"
        aria-live="polite"
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

      <template v-else>
        <div
          v-if="eventTypes.length > 0"
          class="flex flex-wrap items-center gap-2"
          role="group"
          :aria-label="t('events.filterByType')"
        >
          <UButton
            v-for="option in typeOptions"
            :key="option.value ?? 'all'"
            type="button"
            size="sm"
            color="secondary"
            :variant="selectedType === option.value ? 'solid' : 'outline'"
            class="rounded-full"
            :aria-pressed="selectedType === option.value"
            @click="selectedType = option.value"
          >
            {{ option.label }}
          </UButton>
        </div>

        <div v-if="events.length === 0" class="text-muted py-12 text-center">
          {{ t('events.noEvents') }}
        </div>

        <TransitionGroup
          v-else
          appear
          tag="div"
          name="stagger-list"
          class="grid gap-6 sm:grid-cols-2"
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
                <NuxtImg
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
                    {{ event.type }}
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

        <div v-if="pageCount > 1" class="flex justify-center pt-4">
          <UPagination v-model:page="page" :total="total" :items-per-page="EVENTS_PAGE_SIZE" />
        </div>
      </template>
    </article>
  </UContainer>
</template>
