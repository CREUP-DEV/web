<script setup lang="ts">
import type { CREUPEventListItem } from '@/composables/events/useEvents'
import { getEventTypeI18nKey } from '~~/shared/constants/eventTypes'

defineProps<{
  events: CREUPEventListItem[]
  pending: boolean
  failed: boolean
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
    <dl class="max-w-3xl space-y-6 print:max-w-none">
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

    <div class="space-y-4 print:break-inside-avoid">
      <h3 class="text-xl font-semibold">{{ t('pressKit.faq.upcomingTitle') }}</h3>

      <PressKitAsyncState
        :pending="pending"
        :failed="failed"
        :error-title="t('events.loadError')"
        @retry="emit('retry')"
      >
        <template #skeleton>
          <div class="space-y-3">
            <USkeleton v-for="n in 3" :key="n" class="h-16 rounded-xl" />
          </div>
        </template>

        <p v-if="events.length === 0" class="text-muted">{{ t('pressKit.faq.noUpcoming') }}</p>
        <ul
          v-else
          class="divide-default ring-default bg-default divide-y rounded-xl ring-1"
          :aria-label="t('pressKit.faq.upcomingTitle')"
        >
          <li v-for="event in events" :key="event.id" class="p-4">
            <NuxtLink
              :to="localePath(`/conocenos/eventos/${event.slug}`)"
              class="hover:text-primary leading-snug font-semibold underline-offset-2 transition-colors hover:underline"
            >
              {{ event.name }}
            </NuxtLink>
            <p class="text-muted mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-tabler-calendar" class="size-4" aria-hidden="true" />
                {{ formatDateRange(event.startDate, event.endDate, { includeYear: true }) }}
              </span>
              <template v-if="event.location">
                <span aria-hidden="true">&middot;</span>
                <span class="inline-flex items-center gap-1">
                  <UIcon name="i-tabler-map-pin" class="size-4" aria-hidden="true" />
                  {{ event.location }}
                </span>
              </template>
              <template v-if="getEventTypeLabel(event.type)">
                <span aria-hidden="true">&middot;</span>
                <span>{{ getEventTypeLabel(event.type) }}</span>
              </template>
            </p>
          </li>
        </ul>

        <NuxtLink
          :to="localePath('/conocenos/eventos')"
          class="text-primary mt-4 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {{ t('pressKit.faq.allEvents') }}
          <UIcon name="i-tabler-arrow-right" class="size-4" aria-hidden="true" />
        </NuxtLink>
      </PressKitAsyncState>
    </div>
  </div>
</template>
