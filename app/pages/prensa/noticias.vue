<script setup lang="ts">
import { PRESS_ARTICLE_TYPES, type PressArticleType } from '~~/shared/constants/pressTypes'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate: formatLocaleDate } = useLocaleFormatting()

usePageSeo('press.news.title', 'press.news.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.press.label'), path: localePath('/prensa/noticias') },
    { name: t('press.news.title'), path: localePath('/prensa/noticias') },
  ],
})

const LIMIT = 12

const typeParam = useSyncedQueryParam<string | null>('types', {
  parse: (v) => v,
  serialize: (v) => v ?? null,
})
const tagParam = useSyncedQueryParam<string | null>('tag', {
  parse: (v) => v,
  serialize: (v) => v ?? null,
})
const page = useSyncedQueryParam<number>('page', {
  parse: (rawValue) => {
    const parsed = Number(rawValue)
    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
  },
  serialize: (value) => (value > 1 ? String(Math.floor(value)) : null),
})

const selectedTypes = computed<PressArticleType[]>(() => {
  if (!typeParam.value) return []
  return typeParam.value
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is PressArticleType => (PRESS_ARTICLE_TYPES as readonly string[]).includes(s))
})

const { data: tagsData } = useTags()
const availableTagSlugs = computed(() => new Set(tagsData.value?.data.map((tag) => tag.slug)))

const selectedTags = computed<string[]>(() => {
  if (!tagParam.value) return []
  return tagParam.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && availableTagSlugs.value.has(s))
})

watch([typeParam, tagParam], () => {
  page.value = 1
})

const typeQueryRef = computed(() =>
  selectedTypes.value.length > 0 ? (selectedTypes.value as PressArticleType[]) : null
)
const tagQueryRef = computed(() =>
  selectedTags.value.length > 0 ? selectedTags.value.join(',') : null
)
const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending, error, refresh } = usePress(typeQueryRef, tagQueryRef, LIMIT, offset)

const articles = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.total ?? 0)
const pageCount = computed(() => Math.ceil(total.value / LIMIT))
const showErrorState = computed(() => Boolean(error.value) && articles.value.length === 0)

const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, articles, error)

const toggleType = (pressType: PressArticleType) => {
  const current = selectedTypes.value
  const idx = current.indexOf(pressType)
  const next = idx >= 0 ? current.filter((t) => t !== pressType) : [...current, pressType]
  typeParam.value = next.length > 0 ? next.join(',') : null
  page.value = 1
}

const toggleTag = (slug: string | null) => {
  if (!slug) {
    tagParam.value = null
    page.value = 1
    return
  }
  const current = selectedTags.value
  const idx = current.indexOf(slug)
  const next = idx >= 0 ? current.filter((s) => s !== slug) : [...current, slug]
  tagParam.value = next.length > 0 ? next.join(',') : null
  page.value = 1
}

const typeLabels: Record<PressArticleType, string> = {
  press_release: t('press.releases.title'),
  statement: t('press.statements.title'),
  media_appearance: t('press.inMedia.title'),
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-file-text',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

const formatDate = (iso: string) =>
  formatLocaleDate(iso, { year: 'numeric', month: 'long', day: 'numeric' })

const getArticleAnimationStyle = (index: number) => ({
  '--entrance-delay': `${Math.min(index * 50, 450)}ms`,
})
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="t('press.news.title')">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('press.news.title') }}</h1>
        <p class="text-muted mt-2 max-w-2xl text-lg">{{ t('press.news.description') }}</p>
      </header>

      <div class="mb-6 space-y-4">
        <div
          class="flex flex-wrap items-center gap-2"
          role="group"
          :aria-label="t('press.news.filterByType')"
        >
          <UButton
            type="button"
            size="md"
            color="primary"
            icon="i-tabler-list"
            :variant="selectedTypes.length === 0 ? 'solid' : 'outline'"
            :aria-pressed="selectedTypes.length === 0"
            @click="typeParam = null"
          >
            {{ t('common.all') }}
          </UButton>
          <UButton
            v-for="pressType in PRESS_ARTICLE_TYPES"
            :key="pressType"
            type="button"
            size="md"
            color="primary"
            :variant="selectedTypes.includes(pressType) ? 'solid' : 'outline'"
            :icon="typeIcons[pressType]"
            :aria-pressed="selectedTypes.includes(pressType)"
            @click="toggleType(pressType)"
          >
            {{ typeLabels[pressType] }}
          </UButton>
        </div>

        <HomeTagSelector
          :selected-slugs="selectedTags"
          :aria-label="t('press.news.filterByTag')"
          class="mt-2"
          @toggle="toggleTag"
        />
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
          <p>{{ t('press.news.loadError') }}</p>
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
          <p>{{ t('press.news.empty') }}</p>
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
                  v-if="article.image && article.mediaOutlet?.logo"
                  :logo-url="article.mediaOutlet.logo"
                  :outlet-name="article.mediaOutlet.name"
                />
              </div>

              <div class="p-4">
                <div class="text-muted mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                  <time :datetime="article.publishedAt">{{ formatDate(article.publishedAt) }}</time>
                  <span aria-hidden="true">&middot;</span>
                  <span class="flex items-center gap-1">
                    <UIcon :name="typeIcons[article.type]" class="size-3.5" />
                    {{ typeLabels[article.type] }}
                  </span>
                  <template v-if="article.mediaOutlet">
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
              </div>
            </NuxtLink>
          </li>
        </TransitionGroup>
      </div>

      <nav
        v-if="pageCount > 1"
        class="mt-8 flex justify-center"
        :aria-label="t('press.pagination')"
      >
        <UPagination v-model:page="page" :total="total" :items-per-page="LIMIT" />
      </nav>
    </UContainer>
  </section>
</template>
