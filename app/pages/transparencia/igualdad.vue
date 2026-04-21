<script setup lang="ts">
import { getPublicEqualityDocumentsAsyncDataKey } from '~~/shared/constants/publicAsyncDataKeys'

type ActionStepKey = 'safety' | 'notify' | 'details' | 'support'
type PointSafeKey = 'prevention' | 'guidance' | 'followUp'
type ScopeKey =
  | 'sexualViolence'
  | 'gender'
  | 'lgbtiq'
  | 'ethnicity'
  | 'disability'
  | 'otherDiscrimination'

interface EqualityDocument {
  id: string
  title: string
  description: string
  meta: string
  pdfUrl: string
  icon?: string
}

interface EqualityDocumentsResponse {
  items: EqualityDocument[]
  total: number
}

const { t, locale } = useI18n()
const localePath = useLocalePath()
const localeApiHeaders = useLocaleApiHeaders()
const supportMailto = 'mailto:punto.seguro@creup.es'

const accentButtonClass = 'equality-accent-button'

const actionSteps = computed(() => [
  {
    key: 'safety' as ActionStepKey,
    icon: 'i-tabler-shield',
  },
  {
    key: 'notify' as ActionStepKey,
    icon: 'i-tabler-bell-ringing',
  },
  {
    key: 'details' as ActionStepKey,
    icon: 'i-tabler-notes',
  },
  {
    key: 'support' as ActionStepKey,
    icon: 'i-tabler-user-heart',
  },
])

const pointSafeItems = computed(() => [
  {
    key: 'prevention' as PointSafeKey,
    icon: 'i-tabler-speakerphone',
  },
  {
    key: 'guidance' as PointSafeKey,
    icon: 'i-tabler-lifebuoy',
  },
  {
    key: 'followUp' as PointSafeKey,
    icon: 'i-tabler-route-2',
  },
])

const scopeItems = computed(() => [
  {
    key: 'sexualViolence' as ScopeKey,
    icon: 'i-tabler-shield-x',
  },
  {
    key: 'gender' as ScopeKey,
    icon: 'i-tabler-venus',
  },
  {
    key: 'lgbtiq' as ScopeKey,
    icon: 'i-tabler-rainbow',
  },
  {
    key: 'ethnicity' as ScopeKey,
    icon: 'i-tabler-world',
  },
  {
    key: 'disability' as ScopeKey,
    icon: 'i-tabler-accessible',
  },
  {
    key: 'otherDiscrimination' as ScopeKey,
    icon: 'i-tabler-users-group',
  },
])

usePageSeo('equalityPage.title', 'equalityPage.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.transparency.label'),
      path: localePath('/transparencia/igualdad'),
    },
    {
      name: t('nav.transparency.equality'),
      path: localePath('/transparencia/igualdad'),
    },
  ],
})

const LIMIT = 12
const docsPage = ref(1)
const docsOffset = computed(() => (docsPage.value - 1) * LIMIT)
const documentsSectionRef = ref<HTMLElement | null>(null)

const {
  data: documentsData,
  pending: documentsLoading,
  error: documentsError,
  refresh: refreshDocuments,
} = await useFetch<EqualityDocumentsResponse>('/api/equality-documents', {
  key: computed(() => getPublicEqualityDocumentsAsyncDataKey(locale.value, docsOffset.value)),
  headers: localeApiHeaders,
  query: computed(() => ({ limit: LIMIT, offset: docsOffset.value })),
})

const resourceIcons = [
  'i-tabler-scale',
  'i-tabler-shield-heart',
  'i-tabler-users-group',
  'i-tabler-file-text',
]

const docsTotal = computed(() => documentsData.value?.total ?? 0)

const resources = computed(() =>
  (documentsData.value?.items ?? []).map((item, index) => ({
    ...item,
    icon: resourceIcons[(docsOffset.value + index) % resourceIcons.length] ?? 'i-tabler-file-text',
  }))
)
const {
  resultsRef: documentsResultsRef,
  isLoading: documentsIsLoading,
  isRefreshing: documentsIsRefreshing,
} = usePaginatedTransition(documentsLoading, resources, documentsError)

const {
  elRef: documentsRef,
  isVisible: documentsVisible,
  isPending: documentsPending,
  shouldAnimate: documentsShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: actionRef,
  isVisible: actionVisible,
  isPending: actionPending,
  shouldAnimate: actionShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: pointSafeRef,
  isVisible: pointSafeVisible,
  isPending: pointSafePending,
  shouldAnimate: pointSafeShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: scopeRef,
  isVisible: scopeVisible,
  isPending: scopePending,
  shouldAnimate: scopeShouldAnimate,
} = useEntranceObserver(0.1)
const {
  elRef: supportRef,
  isVisible: supportVisible,
  isPending: supportPending,
  shouldAnimate: supportShouldAnimate,
} = useEntranceObserver(0.1)

watch(docsPage, () => {
  nextTick(() => {
    if (documentsSectionRef.value instanceof HTMLElement) {
      documentsSectionRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-6xl space-y-10">
      <header class="equality-hero-surface overflow-hidden rounded-3xl border p-6 sm:p-8 lg:p-10">
        <div class="max-w-4xl space-y-4">
          <div class="space-y-3">
            <h1 class="text-3xl font-bold text-balance sm:text-4xl">
              {{ t('equalityPage.title') }}
            </h1>
            <p class="text-toned text-lg leading-relaxed text-balance">
              {{ t('equalityPage.lead') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              href="#equality-documents"
              icon="i-tabler-arrow-down"
              :label="t('equalityPage.ctaDocuments')"
              :class="accentButtonClass"
            />
            <UButton
              :href="supportMailto"
              variant="soft"
              color="neutral"
              icon="i-tabler-mail"
              :label="t('equalityPage.ctaContact')"
            />
          </div>
        </div>
      </header>

      <section
        id="equality-documents"
        ref="documentsSectionRef"
        aria-labelledby="equality-documents-title"
      >
        <div class="max-w-3xl">
          <h2 id="equality-documents-title" class="text-2xl font-semibold">
            {{ t('equalityPage.resourcesTitle') }}
          </h2>
        </div>

        <div
          ref="documentsResultsRef"
          class="mt-6"
          aria-live="polite"
          :aria-busy="documentsLoading || undefined"
        >
          <div v-if="documentsIsLoading" aria-hidden="true" class="grid gap-4 lg:grid-cols-2">
            <UCard v-for="n in 4" :key="n" class="motion-card h-full">
              <div class="flex h-full flex-col gap-5">
                <div class="space-y-3">
                  <div class="flex items-start gap-3">
                    <USkeleton class="size-11 shrink-0 rounded-2xl" />
                    <div class="min-w-0 flex-1 space-y-2">
                      <USkeleton class="h-5 w-3/4 rounded" />
                      <USkeleton class="h-4 w-1/2 rounded" />
                    </div>
                  </div>

                  <USkeleton class="h-4 w-full rounded" />
                  <USkeleton class="h-4 w-5/6 rounded" />
                </div>

                <USkeleton class="h-10 w-44 rounded-xl" />
              </div>
            </UCard>
          </div>

          <UCard v-else-if="documentsError" class="text-center">
            <div class="flex flex-col items-center gap-3 py-6">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
              <p class="text-muted">{{ t('equalityPage.loadError') }}</p>
              <UButton
                variant="outline"
                color="neutral"
                icon="i-tabler-refresh"
                @click="refreshDocuments()"
              >
                {{ t('home.retry') }}
              </UButton>
            </div>
          </UCard>

          <UCard v-else-if="resources.length === 0" class="text-center">
            <div class="flex flex-col items-center gap-3 py-6">
              <UIcon name="i-tabler-files-off" class="text-muted size-10" />
              <p class="text-muted">{{ t('equalityPage.empty') }}</p>
            </div>
          </UCard>

          <ul
            v-else
            ref="documentsRef"
            class="grid gap-4 lg:grid-cols-2"
            :class="documentsIsRefreshing ? 'opacity-60 transition-opacity duration-200' : ''"
          >
            <li v-for="(resource, index) in resources" :key="resource.id">
              <UCard
                class="motion-card h-full"
                :class="entranceClasses(documentsShouldAnimate, documentsVisible, documentsPending)"
                :style="entranceStyle(documentsVisible, documentsShouldAnimate, index)"
              >
                <div class="flex h-full flex-col gap-5">
                  <div class="space-y-3">
                    <div class="flex items-start gap-3">
                      <span
                        aria-hidden="true"
                        class="equality-icon-badge mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl"
                      >
                        <UIcon :name="resource.icon" class="size-5" />
                      </span>

                      <div class="min-w-0 space-y-2">
                        <h3 class="text-lg font-semibold text-balance">
                          {{ resource.title }}
                        </h3>
                        <p v-if="resource.meta" class="text-muted text-sm">
                          {{ resource.meta }}
                        </p>
                      </div>
                    </div>

                    <p class="text-muted leading-relaxed">
                      {{ resource.description }}
                    </p>
                  </div>

                  <div class="mt-auto">
                    <UButton
                      :href="resource.pdfUrl"
                      external
                      target="_blank"
                      rel="noopener noreferrer"
                      icon="i-tabler-file-download"
                      :label="t('equalityPage.openDocument')"
                      :aria-label="`${t('equalityPage.openDocument')}: ${resource.title}`"
                      :class="accentButtonClass"
                    />
                  </div>
                </div>
              </UCard>
            </li>
          </ul>
        </div>

        <nav
          v-if="docsTotal > LIMIT"
          class="mt-6 flex justify-center"
          :aria-label="`${t('equalityPage.resourcesTitle')} - ${t('accessibility.paginationNavigation')}`"
        >
          <UPagination v-model:page="docsPage" :total="docsTotal" :items-per-page="LIMIT" />
        </nav>
      </section>

      <section aria-labelledby="equality-action">
        <div class="max-w-3xl">
          <h2 id="equality-action" class="text-2xl font-semibold">
            {{ t('equalityPage.actionTitle') }}
          </h2>
        </div>

        <ul ref="actionRef" class="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          <li v-for="(step, index) in actionSteps" :key="step.key">
            <UCard
              class="motion-card h-full"
              :class="entranceClasses(actionShouldAnimate, actionVisible, actionPending)"
              :style="entranceStyle(actionVisible, actionShouldAnimate, index)"
            >
              <div class="space-y-4">
                <span
                  aria-hidden="true"
                  class="equality-icon-badge flex size-11 items-center justify-center rounded-2xl"
                >
                  <UIcon :name="step.icon" class="size-5" />
                </span>

                <div class="space-y-2">
                  <h3 class="text-lg font-semibold">
                    {{ t(`equalityPage.actionSteps.${step.key}.title`) }}
                  </h3>
                  <p class="text-muted leading-relaxed">
                    {{ t(`equalityPage.actionSteps.${step.key}.description`) }}
                  </p>
                </div>
              </div>
            </UCard>
          </li>
        </ul>
      </section>

      <section aria-labelledby="equality-point-safe">
        <div class="space-y-3">
          <h2 id="equality-point-safe" class="text-2xl font-semibold">
            {{ t('equalityPage.pointSafeTitle') }}
          </h2>
          <p class="text-muted leading-relaxed">
            {{ t('equalityPage.pointSafeDescription') }}
          </p>
        </div>

        <div
          ref="pointSafeRef"
          class="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1.95fr)]"
        >
          <UCard
            class="equality-panel-surface"
            :class="entranceClasses(pointSafeShouldAnimate, pointSafeVisible, pointSafePending)"
            :style="entranceStyle(pointSafeVisible, pointSafeShouldAnimate, 0)"
          >
            <div class="space-y-4">
              <span
                aria-hidden="true"
                class="equality-icon-badge-strong flex size-11 items-center justify-center rounded-2xl"
              >
                <UIcon name="i-tabler-shield-heart" class="size-5" />
              </span>

              <div class="space-y-2">
                <h3 class="text-lg font-semibold text-balance">
                  {{ t('equalityPage.pointSafeCalloutTitle') }}
                </h3>
                <p class="text-muted leading-relaxed">
                  {{ t('equalityPage.pointSafeCalloutDescription') }}
                </p>
              </div>

              <UButton
                :href="supportMailto"
                icon="i-tabler-mail"
                :label="t('equalityPage.pointSafePrimary')"
                :class="accentButtonClass"
              />
            </div>
          </UCard>

          <div
            class="equality-muted-surface bg-background/70 dark:bg-background/40 rounded-3xl border p-6 backdrop-blur-sm"
            :class="entranceClasses(pointSafeShouldAnimate, pointSafeVisible, pointSafePending)"
            :style="entranceStyle(pointSafeVisible, pointSafeShouldAnimate, 1)"
          >
            <ul class="space-y-5">
              <li
                v-for="item in pointSafeItems"
                :key="item.key"
                class="equality-divider flex items-start gap-4 border-b pb-5 last:border-b-0 last:pb-0"
              >
                <span
                  aria-hidden="true"
                  class="equality-icon-badge mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl"
                >
                  <UIcon :name="item.icon" class="size-5" />
                </span>

                <div class="space-y-1.5">
                  <h3 class="text-lg font-semibold">
                    {{ t(`equalityPage.pointSafeItems.${item.key}.title`) }}
                  </h3>
                  <p class="text-muted leading-relaxed">
                    {{ t(`equalityPage.pointSafeItems.${item.key}.description`) }}
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section aria-labelledby="equality-scope">
        <div class="max-w-3xl">
          <h2 id="equality-scope" class="text-2xl font-semibold">
            {{ t('equalityPage.scopeTitle') }}
          </h2>
        </div>

        <ul
          ref="scopeRef"
          class="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3"
          :aria-label="t('equalityPage.scopeTitle')"
        >
          <li v-for="(item, index) in scopeItems" :key="item.key">
            <UCard
              class="motion-card h-full"
              :class="entranceClasses(scopeShouldAnimate, scopeVisible, scopePending)"
              :style="entranceStyle(scopeVisible, scopeShouldAnimate, index)"
            >
              <div class="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  class="equality-icon-badge flex size-10 shrink-0 items-center justify-center rounded-2xl"
                >
                  <UIcon :name="item.icon" class="size-5" />
                </span>
                <p class="font-medium">
                  {{ t(`equalityPage.scopeItems.${item.key}`) }}
                </p>
              </div>
            </UCard>
          </li>
        </ul>
      </section>

      <UCard
        ref="supportRef"
        class="equality-panel-surface"
        :class="entranceClasses(supportShouldAnimate, supportVisible, supportPending)"
        :style="entranceStyle(supportVisible, supportShouldAnimate, 0)"
      >
        <section
          aria-labelledby="equality-support"
          class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"
        >
          <div class="max-w-3xl space-y-2">
            <h2 id="equality-support" class="text-2xl font-semibold">
              {{ t('equalityPage.supportTitle') }}
            </h2>
            <p class="text-muted leading-relaxed">
              {{ t('equalityPage.supportDescription') }}
            </p>
          </div>

          <div class="flex flex-wrap gap-3">
            <UButton
              :href="supportMailto"
              icon="i-tabler-mail"
              :label="t('equalityPage.supportPrimary')"
              :class="accentButtonClass"
            />
            <UButton
              href="#equality-documents"
              variant="soft"
              color="neutral"
              icon="i-tabler-files"
              :label="t('equalityPage.supportSecondary')"
            />
          </div>
        </section>
      </UCard>
    </article>
  </UContainer>
</template>
