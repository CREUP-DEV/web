<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { ActivityKind } from '@/composables/activity/useActivity'

const { t } = useI18n()
const localePath = useLocalePath()
const { formatMonthLabel } = useActivityDates()

usePageSeo('activity.title', 'activity.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.transparency.label'), path: localePath('/transparencia/actividad') },
    { name: t('activity.title'), path: localePath('/transparencia/actividad') },
  ],
})

const LIMIT = 12
const ALL_KINDS_VALUE = '__all_kinds__'
const ALL_MONTHS_VALUE = '__all_months__'

const ACTIVITY_KINDS: ActivityKind[] = ['creup', 'member']

const kindParam = useSyncedQueryParam<ActivityKind | null>('kind', {
  parse: (v) => ((ACTIVITY_KINDS as string[]).includes(v ?? '') ? (v as ActivityKind) : null),
  serialize: (v) => v ?? null,
})

const monthParam = useSyncedQueryParam<string | null>('month', {
  parse: (v) => (v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v) ? v : null),
  serialize: (v) => v ?? null,
})

const searchQuery = useSyncedQueryParam<string | null>('q', {
  parse: (v) => v?.trim() || null,
  serialize: (v) => v?.trim() || null,
})

const searchInput = ref(searchQuery.value ?? '')
const page = ref(1)

watch([kindParam, monthParam], () => {
  page.value = 1
})

watch(searchQuery, (value) => {
  if ((value ?? '') !== searchInput.value.trim()) {
    searchInput.value = value ?? ''
  }
})

watchDebounced(
  searchInput,
  (value) => {
    const next = value.trim() || null
    if (next === searchQuery.value) return
    searchQuery.value = next
    page.value = 1
  },
  { debounce: 300, maxWait: 800 }
)

const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending, error, refresh } = useActivityList(
  kindParam,
  monthParam,
  LIMIT,
  offset,
  searchQuery
)

const items = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.total ?? 0)
const pageCount = computed(() => Math.ceil(total.value / LIMIT))
const showErrorState = computed(() => Boolean(error.value) && items.value.length === 0)

const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, items, error)

// Month options: there is no activity-months endpoint, so enumerate a descending static range
// (current month back ~24 months). Labels are localized via the active locale's BCP-47 tag.
const monthOptions = computed(() => {
  const now = new Date()
  const months: string[] = []
  for (let i = 0; i < 24; i += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    months.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return months
})

const monthSelectItems = computed(() => [
  { value: ALL_MONTHS_VALUE, label: t('activity.filters.allMonths'), icon: 'i-tabler-calendar' },
  ...monthOptions.value.map((monthKey) => ({
    value: monthKey,
    label: formatMonthLabel(monthKey),
    icon: 'i-tabler-calendar-month',
  })),
])

const selectedMonthValue = computed(() => monthParam.value ?? ALL_MONTHS_VALUE)

const updateMonthSelection = (value: string | undefined) => {
  monthParam.value = value && value !== ALL_MONTHS_VALUE ? value : null
  page.value = 1
}

const kindSelectItems = computed(() => [
  { value: ALL_KINDS_VALUE, label: t('activity.tabs.all'), icon: 'i-tabler-list' },
  { value: 'creup', label: t('activity.tabs.creup'), icon: 'i-tabler-building' },
  { value: 'member', label: t('activity.tabs.member'), icon: 'i-tabler-users-group' },
])

const selectedKindValue = computed(() => kindParam.value ?? ALL_KINDS_VALUE)

const updateKindSelection = (value: string | undefined) => {
  kindParam.value =
    value && (ACTIVITY_KINDS as string[]).includes(value) ? (value as ActivityKind) : null
  page.value = 1
}

const setKind = (value: ActivityKind | null) => {
  kindParam.value = value
  page.value = 1
}

const detailPath = (slug: string) => localePath(`/transparencia/actividad/${slug}`)

// Area-reports banner: show when the selected month is covered by an edition (mapped via
// coveredToAnchor); with no month selected, link to the most recent anchor. Hidden if no anchors.
const { data: monthsData } = await useAreaReportsMonths()
const anchors = computed(() => monthsData.value?.data.anchors ?? [])
const coveredToAnchor = computed(() => monthsData.value?.data.coveredToAnchor ?? {})

const bannerAnchorKey = computed(() => {
  if (monthParam.value) {
    return coveredToAnchor.value[monthParam.value] ?? null
  }
  return anchors.value[0]?.monthKey ?? null
})

const bannerPath = computed(() =>
  bannerAnchorKey.value
    ? localePath(`/transparencia/actividad/informes/${bannerAnchorKey.value}`)
    : null
)

const getAnimationStyle = (index: number) => ({
  '--entrance-delay': `${Math.min(index * 50, 450)}ms`,
})
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="t('activity.title')">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('activity.title') }}</h1>
        <p class="text-muted mt-2 max-w-2xl text-lg">{{ t('activity.description') }}</p>
      </header>

      <NuxtLink
        v-if="bannerPath"
        :to="bannerPath"
        class="motion-card border-l-primary bg-primary/5 ring-default focus-visible:ring-primary/60 mb-6 flex flex-col gap-3 rounded-xl border-l-4 p-4 ring-1 transition-colors focus:outline-none focus-visible:ring-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
      >
        <div class="flex items-center gap-3">
          <span
            class="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg"
            aria-hidden="true"
          >
            <UIcon name="i-tabler-file-text" class="size-5" />
          </span>
          <span class="font-semibold">{{ t('activity.reports.bannerTitle') }}</span>
        </div>
        <span class="text-primary inline-flex items-center gap-1.5 text-sm font-medium">
          {{ t('activity.reports.bannerCta') }}
          <UIcon name="i-tabler-arrow-right" class="size-4" />
        </span>
      </NuxtLink>

      <div class="mb-6 space-y-4">
        <div class="space-y-2 lg:hidden">
          <USelectMenu
            :model-value="selectedKindValue"
            :items="kindSelectItems"
            value-key="value"
            icon="i-tabler-category"
            class="w-full min-w-0"
            :aria-label="t('activity.filters.filterByType')"
            :ui="{ itemLabel: 'truncate' }"
            @update:model-value="updateKindSelection"
          />
        </div>

        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            class="hidden flex-wrap items-center gap-2 lg:flex"
            role="group"
            :aria-label="t('activity.filters.filterByType')"
          >
            <UButton
              type="button"
              size="md"
              color="primary"
              icon="i-tabler-list"
              :variant="kindParam === null ? 'solid' : 'outline'"
              :aria-pressed="kindParam === null"
              @click="setKind(null)"
            >
              {{ t('activity.tabs.all') }}
            </UButton>
            <UButton
              type="button"
              size="md"
              color="primary"
              icon="i-tabler-building"
              :variant="kindParam === 'creup' ? 'solid' : 'outline'"
              :aria-pressed="kindParam === 'creup'"
              @click="setKind('creup')"
            >
              {{ t('activity.tabs.creup') }}
            </UButton>
            <UButton
              type="button"
              size="md"
              color="primary"
              icon="i-tabler-users-group"
              :variant="kindParam === 'member' ? 'solid' : 'outline'"
              :aria-pressed="kindParam === 'member'"
              @click="setKind('member')"
            >
              {{ t('activity.tabs.member') }}
            </UButton>
          </div>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
            <USelectMenu
              :model-value="selectedMonthValue"
              :items="monthSelectItems"
              value-key="value"
              icon="i-tabler-calendar"
              class="w-full sm:w-56"
              :aria-label="t('activity.filters.month')"
              :ui="{ itemLabel: 'truncate' }"
              @update:model-value="updateMonthSelection"
            />

            <UInput
              v-model="searchInput"
              class="w-full lg:max-w-sm lg:min-w-80"
              icon="i-tabler-search"
              size="lg"
              type="search"
              :placeholder="t('activity.filters.search')"
              :aria-label="t('activity.filters.search')"
            >
              <template v-if="searchInput" #trailing>
                <UButton
                  type="button"
                  color="neutral"
                  variant="link"
                  size="sm"
                  icon="i-tabler-x"
                  :aria-label="t('activity.filters.clearSearch')"
                  @click="searchInput = ''"
                />
              </template>
            </UInput>
          </div>
        </div>
      </div>

      <div ref="resultsRef" aria-live="polite" :aria-busy="pending || undefined">
        <div
          v-if="isLoading"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          aria-hidden="true"
        >
          <div v-for="n in 6" :key="n" class="space-y-3">
            <USkeleton class="aspect-video w-full rounded-xl" />
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-4 w-full" />
          </div>
        </div>

        <div v-else-if="showErrorState" class="text-muted py-12 text-center">
          <UIcon name="i-tabler-alert-circle" class="mx-auto mb-2 size-8 opacity-50" />
          <p>{{ t('activity.loadError') }}</p>
          <UButton
            variant="outline"
            color="neutral"
            icon="i-tabler-refresh"
            class="mt-3"
            @click="refresh()"
          >
            {{ t('home.retry') }}
          </UButton>
        </div>

        <div v-else-if="!items.length" class="text-muted py-12 text-center">
          <UIcon name="i-tabler-calendar-off" class="mx-auto mb-2 size-8 opacity-50" />
          <p>{{ t('activity.emptyList') }}</p>
        </div>

        <TransitionGroup
          v-else
          tag="ul"
          name="stagger-list"
          class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          :aria-busy="isRefreshing || undefined"
          :class="isRefreshing ? 'opacity-70 transition-opacity' : ''"
          role="list"
        >
          <li v-for="(item, index) in items" :key="item.id" :style="getAnimationStyle(index)">
            <ActivityCard :item="item" :to="detailPath(item.slug)" />
          </li>
        </TransitionGroup>
      </div>

      <nav v-if="pageCount > 1" class="mt-8 flex justify-center" :aria-label="t('activity.title')">
        <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
      </nav>
    </UContainer>
  </section>
</template>
