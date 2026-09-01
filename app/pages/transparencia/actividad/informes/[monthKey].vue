<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { formatEditionLabel } = useActivityDates()

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

const AREA_ANCHOR_PATTERN = /^area-\d+$/
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

// Nuxt restores the URL hash before the edition request resolves, when the target card is not in
// the DOM yet, so the jump silently does nothing. Re-run it once the reports render.
watch(
  reports,
  (list) => {
    if (!import.meta.client || !list.length) return

    const targetId = route.hash.slice(1)
    if (!AREA_ANCHOR_PATTERN.test(targetId)) return

    nextTick(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: prefersReducedMotion.value ? 'auto' : 'smooth',
        block: 'start',
      })
    })
  },
  { immediate: true }
)
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="t('activity.reports.title')">
    <UContainer>
      <nav class="mb-6">
        <NuxtLink
          :to="localePath('/transparencia/actividad')"
          class="text-muted hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
        >
          <UIcon name="i-tabler-arrow-left" class="size-4" />
          {{ t('activity.detail.back') }}
        </NuxtLink>
      </nav>

      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('activity.reports.title') }}</h1>

        <div
          v-if="anchors.length"
          class="mt-4 flex items-center justify-center gap-1.5 sm:justify-start sm:gap-2"
        >
          <UButton
            type="button"
            color="neutral"
            variant="outline"
            icon="i-tabler-chevron-left"
            class="shrink-0"
            :disabled="!prevAnchorKey"
            :aria-label="t('activity.reports.prevMonth')"
            @click="goToMonth(prevAnchorKey ?? undefined)"
          />

          <!--
            The trigger is sized by the widest option rather than by the current one, so the arrows
            keep their position across editions. An invisible grid stacks every label in a single
            cell, making the wrapper as wide as the longest one; its padding mirrors the trigger's
            so the measurement includes the same chrome.
          -->
          <div class="relative min-w-0">
            <div
              aria-hidden="true"
              class="invisible grid overflow-hidden py-1.5 ps-2.5 pe-9 text-sm sm:ps-9"
            >
              <span
                v-for="item in monthSelectItems"
                :key="item.value"
                class="col-start-1 row-start-1 whitespace-nowrap"
              >
                {{ item.label }}
              </span>
            </div>

            <USelectMenu
              :model-value="monthKey"
              :items="monthSelectItems"
              value-key="value"
              icon="i-tabler-calendar"
              class="absolute inset-0 w-full"
              :aria-label="t('activity.reports.monthLabel')"
              :ui="{
                base: 'ps-2.5 sm:ps-9',
                leading: 'hidden sm:flex',
                value: 'text-start',
                content: 'w-auto min-w-(--reka-combobox-trigger-width) max-w-[calc(100vw-2rem)]',
                itemLabel: 'whitespace-nowrap',
              }"
              @update:model-value="goToMonth"
            />
          </div>

          <UButton
            type="button"
            color="neutral"
            variant="outline"
            icon="i-tabler-chevron-right"
            class="shrink-0"
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
            :id="`area-${report.areaId}`"
            :aria-labelledby="`area-${report.areaId}-title`"
            class="motion-card group bg-surface ring-default flex h-full scroll-mt-24 flex-col overflow-hidden rounded-xl ring-1"
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
              <div class="flex items-start gap-1">
                <h2
                  :id="`area-${report.areaId}-title`"
                  class="min-w-0 text-lg leading-snug font-semibold"
                >
                  {{ report.areaName }}
                </h2>
                <a
                  :href="`#area-${report.areaId}`"
                  :aria-label="t('activity.reports.areaPermalink', { area: report.areaName })"
                  class="text-muted hover:text-primary focus-visible:ring-primary/60 inline-flex size-6 shrink-0 items-center justify-center rounded-sm opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 focus-visible:ring-2 focus-visible:outline-none pointer-coarse:opacity-100"
                >
                  <UIcon name="i-tabler-link" class="size-4" aria-hidden="true" />
                </a>
              </div>
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
