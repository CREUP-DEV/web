<script setup lang="ts">
/**
 * Mandates (Historic Terms) List Page
 * Displays all mandates with dates and links to their detail pages.
 * Handles URL-driven disambiguation when a year maps to more than one mandate.
 */

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

useSeoMeta({
  title: () => `${t('mandates.title')}`,
  description: () => t('mandates.description'),
  ogTitle: () => `${t('mandates.title')}`,
  ogDescription: () => t('mandates.description'),
})

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Data fetching
// ============================================================================

const { data, error, status } = await useFetch<MandatesResponse>('/api/organigrama/mandatos')

const mandates = computed(() => data.value?.mandates ?? [])

// ============================================================================
// Slug generation
// Uses the shortest prefix that uniquely identifies the mandate:
//   YYYY        → when no other mandate starts in the same year
//   YYYY-MM     → when no other mandate starts in the same year-month
//   YYYY-MM-DD  → fallback (full date)
// ============================================================================

const buildMandateSlug = (mandate: Mandate): string => {
  const all = mandates.value
  const year = mandate.startDate.slice(0, 4)
  if (all.every((m) => m.id === mandate.id || !m.startDate.startsWith(year))) return year

  const yearMonth = mandate.startDate.slice(0, 7)
  if (all.every((m) => m.id === mandate.id || !m.startDate.startsWith(yearMonth))) return yearMonth

  return mandate.startDate
}

// ============================================================================
// Disambiguation modal
// Opened by ?select=YYYY in the URL (e.g. after a redirect from [slug].vue)
// ============================================================================

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

// ============================================================================
// Date formatting helpers
// ============================================================================

const { formatDate: formatLocaleDate } = useLocaleFormatting()

const formatDate = (dateStr: string): string =>
  formatLocaleDate(`${dateStr}T00:00:00`, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

const formatShortDate = (dateStr: string): string =>
  formatLocaleDate(`${dateStr}T00:00:00`, {
    month: 'short',
    year: 'numeric',
  })

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
      <!-- Page Header -->
      <header class="mb-8 text-center sm:mb-12">
        <div class="mb-4">
          <UButton to="/conocenos/equipo" variant="ghost" icon="i-tabler-arrow-left" size="sm">
            {{ t('mandates.backToTeam') }}
          </UButton>
        </div>
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('mandates.title') }}</h1>
        <p class="text-muted mt-3 text-lg">{{ t('mandates.description') }}</p>
      </header>

      <!-- Error -->
      <UAlert
        v-if="error"
        class="mb-6"
        color="error"
        variant="soft"
        icon="i-tabler-alert-triangle"
        :title="t('mandates.loadError')"
      />

      <!-- Loading skeleton -->
      <div v-else-if="status === 'pending'" class="space-y-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-surface/50 rounded-xl p-6 ring-1 ring-gray-200/50 dark:ring-gray-800/50"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="size-12 rounded-lg" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-5 w-48" />
              <USkeleton class="h-4 w-32" />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="mandates.length === 0" class="flex flex-col items-center py-12 text-center">
        <UIcon name="i-tabler-history-off" class="text-muted mb-4 size-16" />
        <p class="text-muted text-lg">{{ t('mandates.noMandates') }}</p>
      </div>

      <!-- Mandates list -->
      <div v-else class="mx-auto max-w-2xl space-y-4">
        <NuxtLink
          v-for="mandate in mandates"
          :key="mandate.id"
          :to="localePath(`/conocenos/equipo/historico/${buildMandateSlug(mandate)}`)"
          class="group bg-surface/50 hover:bg-surface flex items-center gap-4 rounded-xl p-5 ring-1 ring-gray-200/50 transition-all hover:shadow-lg sm:p-6 dark:ring-gray-800/50"
        >
          <!-- Icon -->
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

          <!-- Info -->
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

          <!-- Arrow -->
          <UIcon
            name="i-tabler-chevron-right"
            class="text-muted group-hover:text-primary size-5 shrink-0 transition-colors"
          />
        </NuxtLink>
      </div>
    </UContainer>

    <!-- ================================================================ -->
    <!-- Disambiguation Modal -->
    <!-- Shown when ?select=YYYY resolves to more than one mandate -->
    <!-- ================================================================ -->
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
            class="group bg-surface/50 hover:bg-surface flex items-center gap-4 rounded-xl p-4 ring-1 ring-gray-200/50 transition-all hover:shadow-md dark:ring-gray-800/50"
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
                <UBadge v-if="mandate.isCurrent" color="primary" variant="soft" size="xs">
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
