<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()

usePageSeo('mandates.title', 'mandates.description')

interface Mandate {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

interface MandatesResponse {
  mandates: Mandate[]
  generatedAt?: string | null
}

const { data, error, status } = await useFetch<MandatesResponse>('/api/organigrama/mandatos', {
  headers: localeApiHeaders,
})

const mandates = computed(() => data.value?.mandates ?? [])
const {
  elRef: mandatesRef,
  isVisible: mandatesVisible,
  isPending: mandatesPending,
  shouldAnimate: mandatesShouldAnimate,
} = useEntranceObserver(0.12)

const buildMandateSlug = (mandate: Mandate): string => {
  const all = mandates.value
  const year = mandate.startDate.slice(0, 4)
  if (all.every((m) => m.id === mandate.id || !m.startDate.startsWith(year))) return year

  const yearMonth = mandate.startDate.slice(0, 7)
  if (all.every((m) => m.id === mandate.id || !m.startDate.startsWith(yearMonth))) return yearMonth

  return mandate.startDate
}

const selectYear = computed(() => {
  const raw = route.query.select
  const val = Array.isArray(raw) ? raw[0] : raw
  return typeof val === 'string' && /^\d{4}$/.test(val) ? val : null
})

const disambiguateMandates = computed(() =>
  selectYear.value ? mandates.value.filter((m) => m.startDate.startsWith(selectYear.value!)) : []
)

const disambiguateModalOpen = ref(false)

watch(
  [selectYear, mandates],
  ([year, list]) => {
    if (year && list.length > 0) {
      disambiguateModalOpen.value = true
    }
  },
  { immediate: true }
)

const closeDisambiguateModal = () => {
  disambiguateModalOpen.value = false
}

const { formatLongDate: formatDate, formatMonthYear: formatShortDate } = useDatePresets()

const getDurationText = (startDate: string, endDate: string | null): string => {
  const start = new Date(startDate + 'T00:00:00')
  const end = endDate ? new Date(endDate + 'T00:00:00') : new Date()

  const diffMs = end.getTime() - start.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 30) {
    return t('mandates.durationDays', { count: diffDays })
  }

  const months = Math.floor(diffDays / 30)
  return t('mandates.durationMonths', { count: months })
}
</script>

<template>
  <div>
    <UContainer class="py-8 sm:py-12">
      <header class="mb-8 text-center sm:mb-12">
        <div class="mb-4">
          <UButton
            :to="localePath('/conocenos/equipo')"
            variant="ghost"
            icon="i-tabler-arrow-left"
            size="sm"
          >
            {{ t('mandates.backToTeam') }}
          </UButton>
        </div>
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('mandates.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('mandates.description') }}</p>
      </header>

      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('mandates.loadError')"
      />

      <div v-else-if="status === 'pending'" aria-hidden="true" class="space-y-4">
        <div v-for="n in 3" :key="n" class="bg-surface/50 ring-default rounded-xl p-6 ring-1">
          <div class="flex items-center gap-4">
            <USkeleton class="size-12 rounded-lg" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-48" />
              <USkeleton class="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="mandates.length === 0" class="flex flex-col items-center py-12 text-center">
        <UIcon name="i-tabler-history-off" class="text-muted mb-4 size-16" />
        <p class="text-muted text-lg">{{ t('mandates.noMandates') }}</p>
      </div>

      <div v-else ref="mandatesRef" class="mx-auto max-w-2xl space-y-4">
        <NuxtLink
          v-for="(mandate, index) in mandates"
          :key="mandate.id"
          :to="localePath(`/conocenos/equipo/historico/${buildMandateSlug(mandate)}`)"
          class="motion-card-strong group bg-surface/50 hover:bg-surface ring-default flex items-center gap-4 rounded-xl p-5 ring-1 sm:p-6"
          :class="entranceClasses(mandatesShouldAnimate, mandatesVisible, mandatesPending)"
          :style="entranceStyle(mandatesVisible, mandatesShouldAnimate, index)"
        >
          <div
            class="flex size-12 shrink-0 items-center justify-center rounded-lg"
            :class="
              mandate.isCurrent
                ? 'bg-primary/10 text-primary'
                : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
            "
          >
            <UIcon
              :name="mandate.isCurrent ? 'i-tabler-clock' : 'i-tabler-history'"
              class="size-6"
            />
          </div>

          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h2 class="text-foreground font-semibold">
                {{ formatShortDate(mandate.startDate) }}
                —
                {{ mandate.endDate ? formatShortDate(mandate.endDate) : t('mandates.present') }}
              </h2>
              <UBadge v-if="mandate.isCurrent" color="primary" variant="soft" size="sm">
                {{ t('mandates.current') }}
              </UBadge>
            </div>
            <p class="text-muted mt-1 text-sm">
              {{ formatDate(mandate.startDate) }}
              —
              {{ mandate.endDate ? formatDate(mandate.endDate) : t('mandates.present') }}
            </p>
            <p class="text-muted mt-0.5 text-xs">
              {{ getDurationText(mandate.startDate, mandate.endDate) }}
            </p>
          </div>

          <UIcon
            name="i-tabler-chevron-right"
            class="text-muted group-hover:text-primary size-5 shrink-0 transition-colors"
          />
        </NuxtLink>
      </div>
    </UContainer>

    <UModal
      v-model:open="disambiguateModalOpen"
      :title="t('mandates.disambiguateTitle', { year: selectYear })"
      :description="t('mandates.disambiguateDescription')"
      @close="closeDisambiguateModal"
    >
      <template #body>
        <div class="space-y-3">
          <NuxtLink
            v-for="mandate in disambiguateMandates"
            :key="mandate.id"
            :to="localePath(`/conocenos/equipo/historico/${buildMandateSlug(mandate)}`)"
            class="motion-card group bg-surface/50 hover:bg-surface ring-default flex items-center gap-4 rounded-xl p-4 ring-1"
            @click="closeDisambiguateModal"
          >
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-lg"
              :class="
                mandate.isCurrent
                  ? 'bg-primary/10 text-primary'
                  : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
              "
            >
              <UIcon
                :name="mandate.isCurrent ? 'i-tabler-clock' : 'i-tabler-history'"
                class="size-5"
              />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <span class="text-foreground font-semibold">
                  {{ formatDate(mandate.startDate) }}
                  —
                  {{ mandate.endDate ? formatDate(mandate.endDate) : t('mandates.present') }}
                </span>
                <UBadge v-if="mandate.isCurrent" color="primary" variant="soft" size="sm">
                  {{ t('mandates.current') }}
                </UBadge>
              </div>
              <p class="text-muted mt-0.5 text-xs">
                {{ getDurationText(mandate.startDate, mandate.endDate) }}
              </p>
            </div>
            <UIcon
              name="i-tabler-chevron-right"
              class="text-muted group-hover:text-primary size-4 shrink-0 transition-colors"
            />
          </NuxtLink>
        </div>
      </template>
    </UModal>
  </div>
</template>
