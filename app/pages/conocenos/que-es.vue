<script setup lang="ts">
import { PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY } from '~~/shared/constants/publicAsyncDataKeys'

type RelatedSectionKey = 'members' | 'team' | 'committees' | 'events'
type StatKey = 'universities' | 'students' | 'years'
type ValueKey =
  | 'independence'
  | 'cooperation'
  | 'nonDiscrimination'
  | 'socialCommitment'
  | 'participation'

interface AboutPageContent {
  heroImage: string | null
  heroVisible: boolean
}

const foundationDate = new Date(Date.UTC(2003, 9, 24))
const fallbackMemberCount = 30
const fallbackMemberCountLabel = '+30'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data, error, pending, refresh } = await useFetch<{
  content: AboutPageContent | null
  memberCount: number | null
}>('/api/about-page', {
  key: PUBLIC_ABOUT_PAGE_ASYNC_DATA_KEY,
})

const memberCount = computed(() => data.value?.memberCount ?? fallbackMemberCount)

const formattedMemberCount = computed(() =>
  error.value
    ? fallbackMemberCountLabel
    : new Intl.NumberFormat(locale.value).format(memberCount.value)
)

const completedYears = computed(() => {
  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth()
  const currentDay = now.getUTCDate()

  let years = currentYear - foundationDate.getUTCFullYear()
  const hasReachedAnniversary =
    currentMonth > foundationDate.getUTCMonth() ||
    (currentMonth === foundationDate.getUTCMonth() && currentDay >= foundationDate.getUTCDate())

  if (!hasReachedAnniversary) {
    years -= 1
  }

  return Math.max(years, 0)
})

const { elRef: statsRef, isVisible: statsVisible } = useEntranceObserver(0.15)

const { displayValue: countUniversities, start: startCountUniversities } = useCountUp(memberCount)
const { displayValue: countStudents, start: startCountStudents } = useCountUp(1000000, {
  duration: 2200,
})
const { displayValue: countYears, start: startCountYears } = useCountUp(completedYears)

watch(statsVisible, (visible) => {
  if (visible) {
    startCountUniversities()
    startCountStudents()
    startCountYears()
  }
})

const formattedCountUniversities = computed(() =>
  error.value
    ? fallbackMemberCountLabel
    : new Intl.NumberFormat(locale.value).format(countUniversities.value)
)
const formattedCountStudents = computed(
  () => `+${new Intl.NumberFormat(locale.value).format(countStudents.value)}`
)
const formattedCountYears = computed(() =>
  new Intl.NumberFormat(locale.value).format(countYears.value)
)

const statIcons: Record<StatKey, string> = {
  universities: 'i-tabler-building-community',
  students: 'i-tabler-school',
  years: 'i-tabler-calendar-stats',
}

const stats = computed(() =>
  (['universities', 'students', 'years'] as StatKey[]).map((key) => ({
    key,
    value:
      key === 'universities'
        ? formattedCountUniversities.value
        : key === 'students'
          ? formattedCountStudents.value
          : formattedCountYears.value,
    suffix: key === 'years' ? ` ${t('aboutPage.stats.years.suffix')}` : '',
    label: t(`aboutPage.stats.${key}.label`),
    icon: statIcons[key],
  }))
)

const valueIcons: Record<ValueKey, string> = {
  independence: 'i-tabler-scale',
  cooperation: 'i-tabler-users-group',
  nonDiscrimination: 'i-tabler-accessible',
  socialCommitment: 'i-tabler-heart-handshake',
  participation: 'i-tabler-message-circle-heart',
}

const values = computed(() =>
  (
    [
      'independence',
      'cooperation',
      'nonDiscrimination',
      'socialCommitment',
      'participation',
    ] as ValueKey[]
  ).map((key) => ({
    key,
    icon: valueIcons[key],
    title: t(`aboutPage.values.${key}.title`),
    description: t(`aboutPage.values.${key}.description`),
  }))
)

const {
  elRef: valuesRef,
  isVisible: valuesVisible,
  isPending: valuesPending,
  shouldAnimate: valuesShouldAnimate,
} = useEntranceObserver(0.15)
const {
  elRef: relatedRef,
  isVisible: relatedVisible,
  isPending: relatedPending,
  shouldAnimate: relatedShouldAnimate,
} = useEntranceObserver(0.15)

const relatedSections = computed(() => [
  {
    key: 'members' as RelatedSectionKey,
    to: '/conocenos/miembros',
    icon: 'i-tabler-users-group',
  },
  {
    key: 'team' as RelatedSectionKey,
    to: '/conocenos/equipo',
    icon: 'i-tabler-user-heart',
  },
  {
    key: 'committees' as RelatedSectionKey,
    to: '/conocenos/comites',
    icon: 'i-tabler-sitemap',
  },
  {
    key: 'events' as RelatedSectionKey,
    to: '/conocenos/eventos',
    icon: 'i-tabler-calendar-event',
  },
])

const pageContent = computed(() => ({
  heroImage: data.value?.content?.heroImage ?? null,
  heroVisible: data.value?.content?.heroVisible ?? false,
  title: t('aboutPage.title'),
  lead: t('aboutPage.lead', { count: formattedMemberCount.value }),
  intro: t('aboutPage.intro'),
}))

usePageSeo(
  () => pageContent.value.title,
  () => t('aboutPage.description'),
  {
    webPageType: 'AboutPage',
    breadcrumbs: () => [
      {
        name: t('nav.home'),
        path: localePath('/'),
      },
      {
        name: t('nav.about.whatIs'),
        path: localePath('/conocenos/que-es'),
      },
    ],
  }
)
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-10">
      <div v-if="pending" aria-hidden="true" class="space-y-4">
        <div class="bg-muted overflow-hidden rounded-3xl border">
          <USkeleton class="aspect-1925/550 size-full" />
        </div>

        <header class="mx-auto max-w-3xl space-y-4 text-center">
          <USkeleton class="mx-auto h-10 w-64 rounded" />
          <USkeleton class="mx-auto h-6 w-4/5 rounded" />
          <USkeleton class="mx-auto h-4 w-11/12 rounded" />

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <USkeleton class="h-10 w-40 rounded-xl" />
            <USkeleton class="h-10 w-44 rounded-xl" />
          </div>
        </header>
      </div>

      <template v-else>
        <div v-if="error" class="space-y-3">
          <UAlert
            color="warning"
            variant="soft"
            :title="t('aboutPage.dynamicContentLoadErrorTitle')"
            :description="t('aboutPage.dynamicContentLoadErrorDescription')"
          />
          <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
            {{ t('home.retry') }}
          </UButton>
        </div>

        <section
          v-if="pageContent.heroVisible && pageContent.heroImage"
          :aria-label="pageContent.title"
          class="space-y-4"
        >
          <div class="bg-muted aspect-1925/550 overflow-hidden rounded-3xl border">
            <NuxtImg
              :src="pageContent.heroImage"
              :alt="pageContent.title"
              width="1925"
              height="550"
              class="size-full object-cover"
              loading="eager"
              fetchpriority="high"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
            />
          </div>
        </section>

        <header class="mx-auto max-w-3xl text-center">
          <h1 class="mt-4 text-3xl font-bold sm:text-4xl">{{ pageContent.title }}</h1>
          <p class="text-muted mt-4 text-lg">{{ pageContent.lead }}</p>
          <p v-if="pageContent.intro" class="text-muted mt-4 leading-relaxed">
            {{ pageContent.intro }}
          </p>

          <div class="mt-6 flex flex-wrap justify-center gap-3">
            <UButton
              href="#about-overview"
              icon="i-tabler-arrow-down"
              :label="t('aboutPage.ctaIdentity')"
            />
            <UButton
              :to="localePath('/conocenos/miembros')"
              color="neutral"
              variant="soft"
              icon="i-tabler-users-group"
              :label="t('aboutPage.ctaMembers')"
            />
          </div>
        </header>
      </template>

      <section
        ref="statsRef"
        class="grid gap-4 md:grid-cols-3"
        :aria-label="t('aboutPage.snapshotTitle')"
      >
        <UCard v-for="stat in stats" :key="stat.key" class="motion-card">
          <div class="flex items-start gap-3">
            <div
              class="bg-primary/8 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl"
              aria-hidden="true"
            >
              <UIcon :name="stat.icon" class="size-5" />
            </div>
            <div>
              <p class="text-2xl font-bold tabular-nums">
                {{ stat.value }}<span v-if="stat.suffix">{{ stat.suffix }}</span>
              </p>
              <p class="text-muted mt-1 text-sm leading-relaxed">{{ stat.label }}</p>
            </div>
          </div>
        </UCard>
      </section>

      <div id="about-overview" class="space-y-5">
        <UCard class="border-l-primary motion-card border-l-4">
          <div class="flex items-start gap-4">
            <div
              class="bg-primary/8 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl"
              aria-hidden="true"
            >
              <UIcon name="i-tabler-speakerphone" class="size-5" />
            </div>
            <div class="space-y-2 text-base leading-relaxed">
              <h2 class="text-xl font-semibold">
                {{ t('aboutPage.identityTitle') }}
              </h2>
              <p>{{ t('aboutPage.identityParagraph1') }}</p>
              <p>{{ t('aboutPage.identityParagraph2') }}</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-primary motion-card border-l-4">
          <div class="flex items-start gap-4">
            <div
              class="bg-primary/8 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl"
              aria-hidden="true"
            >
              <UIcon name="i-tabler-clipboard-list" class="size-5" />
            </div>
            <div class="space-y-2 text-base leading-relaxed">
              <h2 class="text-xl font-semibold">
                {{ t('aboutPage.activityTitle') }}
              </h2>
              <p>{{ t('aboutPage.activityParagraph1') }}</p>
              <p>{{ t('aboutPage.activityParagraph2') }}</p>
            </div>
          </div>
        </UCard>

        <UCard class="border-l-primary motion-card border-l-4">
          <div class="flex items-start gap-4">
            <div
              class="bg-primary/8 text-primary mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl"
              aria-hidden="true"
            >
              <UIcon name="i-tabler-heart-handshake" class="size-5" />
            </div>
            <div class="space-y-2 text-base leading-relaxed">
              <h2 class="text-xl font-semibold">
                {{ t('aboutPage.purposeTitle') }}
              </h2>
              <p>{{ t('aboutPage.purposeParagraph') }}</p>
            </div>
          </div>
        </UCard>
      </div>

      <section class="grid gap-4 md:grid-cols-2">
        <UCard class="motion-card">
          <h2 class="text-xl font-semibold">{{ t('aboutPage.missionTitle') }}</h2>
          <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.missionText') }}</p>
        </UCard>

        <UCard class="motion-card">
          <h2 class="text-xl font-semibold">{{ t('aboutPage.visionTitle') }}</h2>
          <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.visionText') }}</p>
        </UCard>
      </section>

      <section ref="valuesRef" aria-labelledby="about-values-title" class="space-y-4">
        <div>
          <h2 id="about-values-title" class="text-xl font-semibold">
            {{ t('aboutPage.valuesTitle') }}
          </h2>
          <p class="text-muted mt-2 leading-relaxed">{{ t('aboutPage.valuesDescription') }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <UCard
            v-for="(value, index) in values"
            :key="value.key"
            class="motion-card h-full"
            :class="entranceClasses(valuesShouldAnimate, valuesVisible, valuesPending)"
            :style="entranceStyle(valuesVisible, valuesShouldAnimate, index, 70)"
          >
            <div class="flex h-full flex-col">
              <div
                class="bg-primary/8 text-primary flex size-11 items-center justify-center rounded-2xl"
                aria-hidden="true"
              >
                <UIcon :name="value.icon" class="size-5" />
              </div>

              <h3 class="mt-4 text-lg font-semibold">{{ value.title }}</h3>
              <p class="text-muted mt-2 text-sm leading-relaxed">{{ value.description }}</p>
            </div>
          </UCard>
        </div>
      </section>

      <section ref="relatedRef" aria-labelledby="about-related-sections">
        <h2 id="about-related-sections" class="text-2xl font-semibold">
          {{ t('aboutPage.sectionsTitle') }}
        </h2>
        <p class="text-muted mt-2 max-w-3xl leading-relaxed">
          {{ t('aboutPage.sectionsDescription') }}
        </p>

        <div class="mt-6 grid gap-4 lg:grid-cols-2">
          <UCard
            v-for="(section, index) in relatedSections"
            :key="section.key"
            class="motion-card flex h-full flex-col justify-between"
            :class="entranceClasses(relatedShouldAnimate, relatedVisible, relatedPending)"
            :style="entranceStyle(relatedVisible, relatedShouldAnimate, index, 70)"
          >
            <div>
              <UIcon :name="section.icon" class="text-primary mb-3 size-6" />
              <h3 class="text-lg font-semibold">
                {{ t(`aboutPage.sections.${section.key}.title`) }}
              </h3>
              <p class="text-muted mt-2 leading-relaxed">
                {{ t(`aboutPage.sections.${section.key}.description`) }}
              </p>
            </div>

            <UButton
              class="mt-5"
              :to="localePath(section.to)"
              variant="soft"
              icon="i-tabler-arrow-right"
              trailing
              :label="t(`aboutPage.sections.${section.key}.cta`)"
            />
          </UCard>
        </div>
      </section>
    </article>
  </UContainer>
</template>
