<script setup lang="ts">
import type { CREUPEventListItem } from '@/composables/events/useEvents'
import { getEventTypeI18nKey } from '~~/shared/constants/eventTypes'

defineProps<{
  events: CREUPEventListItem[]
  pending: boolean
  failed: boolean
  imageLoading: 'lazy' | 'eager'
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDateRange } = useDatePresets()

type FaqKey = 'positioning' | 'resolution' | 'where' | 'assemblies' | 'events'

const faqItems = computed(() =>
  (['positioning', 'resolution', 'where', 'assemblies', 'events'] as FaqKey[]).map((key) => ({
    key,
    question: t(`pressKit.faq.${key}.question`),
    answer: t(`pressKit.faq.${key}.answer`),
  }))
)

const policyLinks = computed(() => [
  {
    key: 'positions',
    to: localePath('/politica/posicionamientos'),
    label: t('policy.positions.title'),
  },
  {
    key: 'resolutions',
    to: localePath('/politica/resoluciones'),
    label: t('policy.resolutions.title'),
  },
])

const annualEvents = computed(() => [
  {
    key: 'stage',
    title: t('events.types.stageFormativo'),
    description: t('pressKit.faq.events.stage'),
  },
  {
    key: 'congress',
    title: t('events.types.congresoYEncuentro'),
    description: t('pressKit.faq.events.congress'),
  },
])

const getEventTypeLabel = (eventType: string | null) => {
  const key = getEventTypeI18nKey(eventType)
  return key ? t(key) : eventType
}
</script>

<template>
  <div class="space-y-10">
    <dl class="space-y-6">
      <div v-for="item in faqItems" :key="item.key" class="print:break-inside-avoid">
        <dt class="text-lg font-semibold">{{ item.question }}</dt>
        <dd class="mt-2 space-y-3 leading-relaxed">
          <p>{{ item.answer }}</p>

          <ul v-if="item.key === 'where'" class="flex flex-wrap gap-x-4 gap-y-1">
            <li v-for="link in policyLinks" :key="link.key">
              <NuxtLink
                :to="link.to"
                class="text-primary inline-flex items-center gap-1 font-medium hover:underline"
              >
                <UIcon name="i-tabler-arrow-right" class="size-4" aria-hidden="true" />
                {{ link.label }}
              </NuxtLink>
            </li>
          </ul>

          <ul v-else-if="item.key === 'events'" class="space-y-2">
            <li v-for="annualEvent in annualEvents" :key="annualEvent.key">
              <span class="font-semibold">{{ annualEvent.title }}:</span>
              {{ annualEvent.description }}
            </li>
          </ul>
        </dd>
      </div>
    </dl>

    <div class="space-y-4">
      <h3 class="text-xl font-semibold">{{ t('pressKit.faq.upcomingTitle') }}</h3>

      <PressKitAsyncState
        :pending="pending"
        :failed="failed"
        :error-title="t('events.loadError')"
        @retry="emit('retry')"
      >
        <template #skeleton>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <USkeleton v-for="n in 3" :key="n" class="h-48 rounded-xl" />
          </div>
        </template>

        <p v-if="events.length === 0" class="text-muted">{{ t('pressKit.faq.noUpcoming') }}</p>
        <ul
          v-else
          class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:break-inside-avoid print:grid-cols-3 print:gap-3"
          :aria-label="t('pressKit.faq.upcomingTitle')"
        >
          <li v-for="event in events" :key="event.id">
            <NuxtLink
              :to="localePath(`/conocenos/eventos/${event.slug}`)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-default ring-default flex h-full flex-col overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted aspect-7/2 overflow-hidden">
                <AdaptiveImage
                  v-if="event.banner.url"
                  :src="event.banner.url"
                  :alt="t('events.bannerAlt', { event: event.name })"
                  width="700"
                  height="200"
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 330px"
                  format="webp"
                  quality="72"
                  class="motion-link-media size-full object-cover"
                  :loading="imageLoading"
                  decoding="async"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-calendar-event" class="size-10" />
                </div>
              </div>

              <div class="space-y-1 p-4 print:p-3">
                <p class="group-hover:text-primary leading-snug font-semibold transition-colors">
                  {{ event.name }}
                </p>
                <p class="text-muted text-sm">
                  <UIcon
                    name="i-tabler-calendar"
                    class="mr-1 inline-block size-4 align-text-bottom"
                    aria-hidden="true"
                  />
                  {{ formatDateRange(event.startDate, event.endDate, { includeYear: true }) }}
                </p>
                <p v-if="event.location" class="text-muted text-sm">
                  <UIcon
                    name="i-tabler-map-pin"
                    class="mr-1 inline-block size-4 align-text-bottom"
                    aria-hidden="true"
                  />
                  {{ event.location }}
                </p>
                <p v-if="getEventTypeLabel(event.type)" class="text-muted text-xs">
                  {{ getEventTypeLabel(event.type) }}
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>

        <!-- Not printed: on paper it would be a label with no address. -->
        <NuxtLink
          :to="localePath('/conocenos/eventos')"
          class="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline print:hidden"
        >
          {{ t('pressKit.faq.allEvents') }}
          <UIcon name="i-tabler-arrow-right" class="size-4" aria-hidden="true" />
        </NuxtLink>
      </PressKitAsyncState>
    </div>
  </div>
</template>
