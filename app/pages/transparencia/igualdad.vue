<script setup lang="ts">
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

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const supportMailto = 'mailto:punto.seguro@creup.es'

const accentButtonClass =
  'bg-[#513269] text-white hover:bg-[#452a59] focus-visible:ring-2 focus-visible:ring-[#513269]/40 focus-visible:outline-none dark:bg-[#6d4a88] dark:hover:bg-[#7b5599]'

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

usePageSeo('equalityPage.title', 'equalityPage.description')

const LIMIT = 12
const docsPage = ref(1)
const docsOffset = computed(() => (docsPage.value - 1) * LIMIT)

const { data: documentsData, error: documentsError } = await useFetch<EqualityDocumentsResponse>(
  '/api/equality-documents',
  {
    headers: localeApiHeaders,
    query: computed(() => ({ limit: LIMIT, offset: docsOffset.value })),
  }
)

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
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-6xl space-y-10">
      <header
        class="overflow-hidden rounded-3xl border border-[rgba(81,50,105,0.16)] bg-[linear-gradient(135deg,rgba(81,50,105,0.14),rgba(81,50,105,0.04))] p-6 sm:p-8 lg:p-10 dark:border-[rgba(216,190,231,0.2)] dark:bg-[linear-gradient(135deg,rgba(81,50,105,0.32),rgba(81,50,105,0.14))]"
      >
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

      <section id="equality-documents" aria-labelledby="equality-documents-title">
        <div class="max-w-3xl">
          <h2 id="equality-documents-title" class="text-2xl font-semibold">
            {{ t('equalityPage.resourcesTitle') }}
          </h2>
        </div>

        <UCard v-if="documentsError" class="mt-6 text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-alert-triangle" class="text-error size-10" />
            <p class="text-muted">{{ t('equalityPage.loadError') }}</p>
          </div>
        </UCard>

        <UCard v-else-if="resources.length === 0" class="mt-6 text-center">
          <div class="flex flex-col items-center gap-3 py-6">
            <UIcon name="i-tabler-files-off" class="text-muted size-10" />
            <p class="text-muted">{{ t('equalityPage.empty') }}</p>
          </div>
        </UCard>

        <ul v-else ref="documentsRef" class="mt-6 grid gap-4 lg:grid-cols-2">
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
                      class="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
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

        <div v-if="docsTotal > LIMIT" class="mt-6 flex justify-center">
          <UPagination v-model:page="docsPage" :total="docsTotal" :items-per-page="LIMIT" />
        </div>
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
                  class="flex size-11 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
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
            class="border-[rgba(81,50,105,0.16)] bg-[linear-gradient(135deg,rgba(81,50,105,0.1),rgba(81,50,105,0.03))] dark:border-[rgba(216,190,231,0.18)] dark:bg-[linear-gradient(135deg,rgba(81,50,105,0.28),rgba(81,50,105,0.1))]"
            :class="entranceClasses(pointSafeShouldAnimate, pointSafeVisible, pointSafePending)"
            :style="entranceStyle(pointSafeVisible, pointSafeShouldAnimate, 0)"
          >
            <div class="space-y-4">
              <span
                aria-hidden="true"
                class="flex size-11 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.14)] text-[#513269] dark:bg-[rgba(216,190,231,0.18)] dark:text-[#d8bee7]"
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
            class="rounded-3xl border border-[rgba(81,50,105,0.12)] bg-white/70 p-6 backdrop-blur-sm dark:border-[rgba(216,190,231,0.16)] dark:bg-white/4"
            :class="entranceClasses(pointSafeShouldAnimate, pointSafeVisible, pointSafePending)"
            :style="entranceStyle(pointSafeVisible, pointSafeShouldAnimate, 1)"
          >
            <ul class="space-y-5">
              <li
                v-for="item in pointSafeItems"
                :key="item.key"
                class="flex items-start gap-4 border-b border-[rgba(81,50,105,0.08)] pb-5 last:border-b-0 last:pb-0 dark:border-[rgba(216,190,231,0.12)]"
              >
                <span
                  aria-hidden="true"
                  class="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
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
                  class="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[rgba(81,50,105,0.12)] text-[#513269] dark:bg-[rgba(216,190,231,0.16)] dark:text-[#d8bee7]"
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
        class="border-[rgba(81,50,105,0.16)] bg-[linear-gradient(135deg,rgba(81,50,105,0.1),rgba(81,50,105,0.03))] dark:border-[rgba(216,190,231,0.18)] dark:bg-[linear-gradient(135deg,rgba(81,50,105,0.28),rgba(81,50,105,0.1))]"
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
