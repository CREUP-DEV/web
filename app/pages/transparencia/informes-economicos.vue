<script setup lang="ts">
import { getPublicFinancialReportsAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'
import { publicCmsCachedData } from '@/utils/publicCmsCachedData'

interface FinancialReport {
  id: string
  title: string
  pdfUrl: string
  approvedAt: string
}

interface FinancialReportsResponse {
  data: FinancialReport[]
  meta: {
    total: number
  }
}

const { t, locale } = useI18n()
const localePath = useLocalePath()
const { formatLongDate } = useDatePresets()
const localeApiHeaders = useLocaleApiHeaders()

usePageSeo('financialReports.title', 'financialReports.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.transparency.label'),
      path: localePath('/transparencia/informes-economicos'),
    },
    {
      name: t('nav.transparency.financialReports'),
      path: localePath('/transparencia/informes-economicos'),
    },
  ],
})

const LIMIT = 12
const page = ref(1)
const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending, error, refresh } = await useFetch<FinancialReportsResponse>(
  '/api/financial-reports',
  {
    key: computed(() => getPublicFinancialReportsAsyncDataKey(locale.value, offset.value)),
    headers: localeApiHeaders,
    query: computed(() => ({ limit: LIMIT, offset: offset.value })),
    getCachedData: publicCmsCachedData,
  }
)

const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta?.total ?? 0)
const getEntranceDelay = (index: number) => getEntranceDelayStyle(index, 70)

const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, items, error)

// WCAG 4.1.3: concise polite status announced on result/page change, instead of
// an aria-live region wrapping the whole grid (which re-reads or stays silent).
const a11yResultsStatus = computed(() => {
  const totalPages = Math.max(1, Math.ceil(total.value / LIMIT))
  return totalPages > 1
    ? t(
        'accessibility.resultsStatus',
        { count: total.value, page: page.value, pages: totalPages },
        total.value
      )
    : t('accessibility.resultsCount', { count: total.value }, total.value)
})

watch(page, () => {
  nextTick(() => {
    if (resultsRef.value instanceof HTMLElement) {
      resultsRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})

function formatDate(dateStr: string): string {
  try {
    return formatLongDate(dateStr)
  } catch {
    return dateStr
  }
}
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-8">
      <header class="mx-auto max-w-3xl text-center">
        <h1 class="text-3xl font-bold sm:text-4xl">
          {{ t('financialReports.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('financialReports.description') }}
        </p>
      </header>

      <p v-if="!isLoading" class="sr-only" role="status">{{ a11yResultsStatus }}</p>
      <div ref="resultsRef" :aria-busy="pending || undefined">
        <div v-if="isLoading" aria-hidden="true" class="space-y-3">
          <UCard v-for="n in 4" :key="n" class="motion-card">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div class="min-w-0 flex-1 space-y-2">
                <USkeleton class="h-5 w-3/4 rounded" />
                <USkeleton class="h-4 w-40 rounded" />
              </div>
              <USkeleton class="h-9 w-28 rounded-lg" />
            </div>
          </UCard>
        </div>

        <UCard v-else-if="error" class="text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
            <p class="text-muted">
              {{ t('financialReports.loadError') }}
            </p>
            <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
              {{ t('home.retry') }}
            </UButton>
          </div>
        </UCard>

        <UCard v-else-if="items.length === 0" class="text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-file-off" class="text-muted size-10" />
            <p class="text-muted">
              {{ t('financialReports.empty') }}
            </p>
          </div>
        </UCard>

        <TransitionGroup
          v-else
          appear
          tag="ul"
          name="stagger-list"
          class="space-y-3"
          :class="isRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
          :aria-label="t('financialReports.title')"
        >
          <li v-for="(report, index) in items" :key="report.id">
            <UCard class="motion-card" :style="getEntranceDelay(index)">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0 flex-1 space-y-1">
                  <p class="text-base leading-snug font-medium">
                    {{ report.title }}
                  </p>
                  <div class="text-muted flex items-center gap-1 text-sm">
                    <UIcon name="i-tabler-calendar-check" class="size-4 shrink-0" />
                    <time :datetime="report.approvedAt">
                      {{
                        t('financialReports.approvedOn', { date: formatDate(report.approvedAt) })
                      }}
                    </time>
                  </div>
                </div>

                <UButton
                  :href="report.pdfUrl"
                  external
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="soft"
                  icon="i-tabler-download"
                  size="sm"
                  :label="t('financialReports.download')"
                  :aria-label="`${t('financialReports.download')}: ${report.title}`"
                />
              </div>
            </UCard>
          </li>
        </TransitionGroup>
      </div>

      <nav
        v-if="total > LIMIT"
        class="flex justify-center"
        :aria-label="`${t('financialReports.title')} - ${t('accessibility.paginationNavigation')}`"
      >
        <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
      </nav>
    </article>
  </UContainer>
</template>
