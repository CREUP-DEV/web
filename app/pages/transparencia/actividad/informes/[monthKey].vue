<script setup lang="ts">
const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { formatEditionLabel, formatMonthLabel } = useActivityDates()

const MONTH_KEY_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/

const rawMonthKey = computed(() => {
  const raw = Array.isArray(route.params.monthKey)
    ? route.params.monthKey[0]
    : route.params.monthKey
  return raw ?? ''
})

const isValidMonthKey = computed(() => MONTH_KEY_PATTERN.test(rawMonthKey.value))

// Only a well-formed 'YYYY-MM' key reaches the fetch and the label formatters; a malformed key
// (e.g. /informes/foo) is treated as "no edition" so the graceful empty state renders.
const monthKey = computed(() => (isValidMonthKey.value ? rawMonthKey.value : ''))

const { data: monthsData } = await useAreaReportsMonths()
const anchors = computed(() => monthsData.value?.data.anchors ?? [])

const { data, pending, error } = await useAreaReportsEdition(monthKey)
const edition = computed(() => data.value?.data.edition ?? null)
const reports = computed(() => data.value?.data.reports ?? [])

const mostRecentAnchorKey = computed(() => anchors.value[0]?.monthKey ?? null)
const mostRecentPath = computed(() =>
  mostRecentAnchorKey.value
    ? localePath(`/transparencia/actividad/informes/${mostRecentAnchorKey.value}`)
    : null
)

const headingLabel = computed(() => {
  if (edition.value) {
    return `${t('activity.reports.heading')} · ${formatEditionLabel(edition.value)}`
  }
  // No edition: only show a month label when the route param is a valid 'YYYY-MM' key.
  if (isValidMonthKey.value) {
    return `${t('activity.reports.heading')} · ${formatMonthLabel(monthKey.value)}`
  }
  return t('activity.reports.heading')
})

// Anchor navigation: anchors are sorted desc, so index-1 is the next (newer) month.
const currentAnchorIndex = computed(() =>
  anchors.value.findIndex((anchor) => anchor.monthKey === monthKey.value)
)
const prevAnchorKey = computed(() => {
  const idx = currentAnchorIndex.value
  return idx >= 0 ? (anchors.value[idx + 1]?.monthKey ?? null) : null
})
const nextAnchorKey = computed(() => {
  const idx = currentAnchorIndex.value
  return idx > 0 ? (anchors.value[idx - 1]?.monthKey ?? null) : null
})

const monthSelectItems = computed(() =>
  anchors.value.map((anchor) => ({
    value: anchor.monthKey,
    label: formatEditionLabel(anchor),
  }))
)

const goToMonth = (key: string | undefined) => {
  if (!key || key === monthKey.value) return
  navigateTo(localePath(`/transparencia/actividad/informes/${key}`))
}

usePageSeo('activity.reports.title', 'activity.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.transparency.label'), path: localePath('/transparencia/actividad') },
    { name: t('activity.title'), path: localePath('/transparencia/actividad') },
    {
      name: t('activity.reports.breadcrumb'),
      path: localePath(`/transparencia/actividad/informes/${monthKey.value}`),
    },
  ],
})

const showEmptyState = computed(
  () => !pending.value && (Boolean(error.value) || !edition.value || reports.value.length === 0)
)

const { locale } = useI18n()
// WCAG 3.1.2: mark prose served in a different language than the page.
const bodyLang = (fieldLocale?: string | null) =>
  fieldLocale && fieldLocale !== locale.value ? fieldLocale : undefined

const getEntranceDelay = (index: number) => getEntranceDelayStyle(index, 70)
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="t('activity.reports.title')">
    <UContainer>
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-3xl font-bold sm:text-4xl">{{ t('activity.reports.title') }}</h1>
          <p class="text-muted mt-2 text-lg">
            {{ headingLabel }}
            <template v-if="!showEmptyState">
              · {{ t('activity.reports.areasCount', { count: reports.length }, reports.length) }}
            </template>
          </p>
        </div>

        <div v-if="anchors.length" class="flex items-center gap-2">
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            icon="i-tabler-chevron-left"
            :disabled="!prevAnchorKey"
            :aria-label="t('activity.reports.prevMonth')"
            @click="goToMonth(prevAnchorKey ?? undefined)"
          />

          <USelectMenu
            :model-value="monthKey"
            :items="monthSelectItems"
            value-key="value"
            icon="i-tabler-calendar"
            class="min-w-44"
            :aria-label="t('activity.reports.monthLabel')"
            :ui="{ itemLabel: 'truncate' }"
            @update:model-value="goToMonth"
          />

          <UButton
            type="button"
            color="neutral"
            variant="outline"
            icon="i-tabler-chevron-right"
            :disabled="!nextAnchorKey"
            :aria-label="t('activity.reports.nextMonth')"
            @click="goToMonth(nextAnchorKey ?? undefined)"
          />
        </div>
      </header>

      <div v-if="pending" aria-hidden="true" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div v-for="n in 4" :key="n" class="space-y-3">
          <USkeleton class="aspect-video w-full rounded-xl" />
          <USkeleton class="h-5 w-1/2" />
          <USkeleton class="h-4 w-full" />
        </div>
      </div>

      <UCard v-else-if="showEmptyState" class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-file-off" class="text-muted size-10" />
          <p class="text-muted">{{ t('activity.reports.empty') }}</p>
          <UButton
            v-if="mostRecentPath && mostRecentAnchorKey !== monthKey"
            :to="mostRecentPath"
            variant="outline"
            color="neutral"
            icon="i-tabler-calendar"
          >
            {{ t('activity.reports.viewReport') }}
          </UButton>
        </div>
      </UCard>

      <TransitionGroup
        v-else
        appear
        tag="ul"
        name="stagger-list"
        class="grid grid-cols-1 gap-6 lg:grid-cols-2"
        role="list"
      >
        <li v-for="(report, index) in reports" :key="report.id" :style="getEntranceDelay(index)">
          <article
            class="motion-card bg-surface ring-default flex h-full flex-col overflow-hidden rounded-xl ring-1"
          >
            <figure class="m-0">
              <div class="bg-muted relative aspect-video overflow-hidden">
                <AdaptiveImage
                  v-if="report.image"
                  :src="report.image"
                  :alt="report.alt || ''"
                  width="640"
                  height="360"
                  class="size-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-file-text" class="size-12" />
                </div>
              </div>
              <figcaption
                v-if="report.image && report.imageCaption"
                :lang="bodyLang(report.imageCaptionLocale)"
                class="text-muted px-4 pt-2 text-xs"
              >
                {{ report.imageCaption }}
              </figcaption>
            </figure>

            <div class="flex flex-1 flex-col p-4">
              <h2 class="text-lg leading-snug font-semibold">{{ report.areaName }}</h2>
              <PressRichText
                :lang="bodyLang(report.contentLocale)"
                :html="report.contentHtml"
                class="mt-3"
              />
            </div>
          </article>
        </li>
      </TransitionGroup>
    </UContainer>
  </section>
</template>
