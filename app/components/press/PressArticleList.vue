<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { PressArticleType } from '@/composables/press/usePress'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

const props = defineProps<{
  type: PressArticleType
  title: string
  description: string
  emptyMessage: string
  errorMessage: string
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate: formatLocaleDate } = useLocaleFormatting()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const LIMIT = 12
const { page, toggleTag, selectedTags, tagQuery, tagsData, tagsPending } = usePressArchiveFilters(
  () => props.type
)
const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending, error, refresh } = usePress(props.type, tagQuery, LIMIT, offset)

const articles = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.total ?? 0)
const isLoading = computed(() => pending.value && articles.value.length === 0 && !error.value)
const isRefreshing = computed(() => pending.value && articles.value.length > 0)
const showErrorState = computed(() => Boolean(error.value) && articles.value.length === 0)
const resultsContainerRef = ref<HTMLElement | null>(null)

const resultsTransitionKey = computed(() => {
  const articleIds = articles.value.map((article) => article.id).join(',')
  return [
    selectedTags.value.join(',') || 'all',
    page.value,
    pending.value ? 'pending' : 'ready',
    showErrorState.value ? 'error' : 'ok',
    articleIds,
  ].join('|')
})

const formatDate = (iso: string) => {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getArticleAnimationStyle = (index: number) => {
  const step = 50
  const maxDelay = 450
  const enterDelay = Math.min(index * step, maxDelay)

  return {
    '--entrance-delay': `${Math.max(0, enterDelay)}ms`,
  }
}

const resetResultsContainerMotion = () => {
  const el = resultsContainerRef.value

  if (!el) {
    return
  }

  el.style.height = ''
  el.style.overflow = ''
  el.style.transition = ''
}

watch(
  prefersReducedMotion,
  (isReduced) => {
    if (isReduced) {
      resetResultsContainerMotion()
    }
  },
  { immediate: true }
)

watch(resultsTransitionKey, async () => {
  const el = resultsContainerRef.value
  if (!el) return

  if (prefersReducedMotion.value) {
    resetResultsContainerMotion()
    return
  }

  const startHeight = el.offsetHeight

  await nextTick()

  el.style.height = 'auto'
  const endHeight = el.offsetHeight

  if (startHeight === endHeight) return

  el.style.overflow = 'hidden'
  el.style.height = `${startHeight}px`
  void el.offsetHeight

  el.style.transition = 'height 350ms ease-out'
  el.style.height = `${endHeight}px`

  const onEnd = () => {
    el.style.height = ''
    el.style.overflow = ''
    el.style.transition = ''
    el.removeEventListener('transitionend', onEnd)
  }

  el.addEventListener('transitionend', onEnd)
})

watch(page, () => {
  nextTick(() => {
    if (resultsContainerRef.value instanceof HTMLElement) {
      resultsContainerRef.value.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
})
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="title">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ title }}</h1>
        <p class="text-muted mt-2 max-w-2xl text-lg">{{ description }}</p>
      </header>

      <HomeTagSelector
        :tags="tagsData?.data ?? []"
        :pending="tagsPending"
        :selected-slugs="selectedTags"
        :aria-label="title"
        class="mb-6"
        @toggle="toggleTag"
      />

      <div ref="resultsContainerRef" aria-live="polite" :aria-busy="pending || undefined">
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
          <p>{{ errorMessage }}</p>
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

        <div v-else-if="!articles.length" class="text-muted py-12 text-center">
          <UIcon name="i-tabler-news-off" class="mx-auto mb-2 size-8 opacity-50" />
          <p>{{ emptyMessage }}</p>
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
          <li
            v-for="(article, index) in articles"
            :key="article.id"
            :style="getArticleAnimationStyle(index)"
          >
            <NuxtLink
              :to="localePath(`${getPressArticlePublicListPath(article.type)}/${article.slug}`)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-surface ring-default block overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted relative aspect-video overflow-hidden">
                <NuxtImg
                  v-if="article.image"
                  :src="article.image"
                  :alt="article.alt || ''"
                  width="640"
                  height="360"
                  class="motion-link-media size-full object-cover"
                  loading="lazy"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-news" class="size-12" />
                </div>
                <PressMediaOutletLogoOverlay
                  v-if="type === 'media_appearance' && article.image && article.mediaOutlet?.logo"
                  :logo-url="article.mediaOutlet.logo"
                  :outlet-name="article.mediaOutlet.name"
                />
              </div>

              <div class="p-4">
                <div class="text-muted mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
                  <template v-if="article.mediaOutlet && type !== 'media_appearance'">
                    <span aria-hidden="true">&middot;</span>
                    <span class="flex items-center gap-1">
                      <NuxtImg
                        v-if="article.mediaOutlet.logo"
                        :src="article.mediaOutlet.logo"
                        :alt="article.mediaOutlet.name"
                        height="16"
                        fit="inside"
                        class="inline-block max-h-3.5 w-auto object-contain"
                        loading="lazy"
                      />
                      {{ article.mediaOutlet.name }}
                    </span>
                  </template>
                  <template
                    v-else-if="
                      article.mediaOutlet &&
                      type === 'media_appearance' &&
                      !article.mediaOutlet.logo
                    "
                  >
                    <span aria-hidden="true">&middot;</span>
                    <span>{{ article.mediaOutlet.name }}</span>
                  </template>
                </div>

                <UTooltip :text="article.title">
                  <h2
                    class="group-hover:text-primary line-clamp-2 leading-snug font-semibold transition-colors"
                  >
                    {{ article.title }}
                  </h2>
                </UTooltip>

                <p v-if="article.description" class="text-muted mt-1.5 line-clamp-2 text-sm">
                  {{ article.description }}
                </p>

                <div v-if="article.tags.length" class="mt-3 flex flex-wrap gap-1.5">
                  <span
                    v-for="tag in article.tags"
                    :key="tag.slug"
                    class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
                  >
                    {{ tag.name }}
                  </span>
                </div>

                <div
                  v-if="article.pdfUrl"
                  class="text-muted mt-3 flex flex-wrap items-center gap-3 text-xs"
                >
                  <div v-if="article.pdfUrl" class="flex items-center gap-1">
                    <UIcon name="i-tabler-file-type-pdf" class="size-4" />
                    <span>{{ t('press.downloadPdf') }}</span>
                  </div>
                </div>
              </div>
            </NuxtLink>
          </li>
        </TransitionGroup>
      </div>

      <nav
        v-if="total > LIMIT"
        class="mt-8 flex justify-center"
        :aria-label="t('press.pagination')"
      >
        <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
      </nav>
    </UContainer>
  </section>
</template>
