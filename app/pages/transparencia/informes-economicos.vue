<script setup lang="ts">
interface FinancialReport {
  id: string
  title: string
  pdfUrl: string
  approvedAt: string
}

interface FinancialReportsResponse {
  items: FinancialReport[]
  total: number
}

const { t } = useI18n()
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

const { data, pending, error } = await useFetch<FinancialReportsResponse>(
  '/api/financial-reports',
  {
    headers: localeApiHeaders,
    query: computed(() => ({ limit: LIMIT, offset: offset.value })),
  }
)

const items = computed(() => data.value?.items ?? [])
const total = computed(() => data.value?.total ?? 0)
const getEntranceDelay = (index: number) => useEntranceDelay(index, 70)

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

      <div v-if="pending" aria-hidden="true" class="space-y-4">
        <USkeleton class="mx-auto h-8 w-72 rounded" />
        <div class="space-y-3">
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
      </div>

      <UCard v-else-if="error" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
          <p class="text-muted">
            {{ t('financialReports.loadError') }}
          </p>
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
                    {{ t('financialReports.approvedOn', { date: formatDate(report.approvedAt) }) }}
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

      <div v-if="total > LIMIT" class="flex justify-center">
        <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
      </div>
    </article>
  </UContainer>
</template>
