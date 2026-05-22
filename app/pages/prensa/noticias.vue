<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import { usePressArchiveFilters } from '@/composables/press/usePressArchiveFilters'
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

const searchQuery = useSyncedQueryParam<string | null>('q', {
  parse: (v) => v?.trim() || null,
  serialize: (v) => v?.trim() || null,
})

const searchInput = ref(searchQuery.value ?? '')

const { page, toggleTag, selectedTags, tagQuery, tagsData, tagsPending } = usePressArchiveFilters(
  () => null
)

const ALL_TYPES_VALUE = '__all_types__'
const ALL_TAGS_VALUE = '__all_tags__'

const selectedTypes = computed<PressArticleType[]>(() => {
  if (!typeParam.value) return []
  return typeParam.value
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is PressArticleType => (PRESS_ARTICLE_TYPES as readonly string[]).includes(s))
})

watch(typeParam, () => {
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

const typeQueryRef = computed(() =>
  selectedTypes.value.length > 0 ? (selectedTypes.value as PressArticleType[]) : null
)
const tagQueryRef = computed(() =>
  selectedTags.value.length > 0 ? selectedTags.value.join(',') : null
)
const offset = computed(() => (page.value - 1) * LIMIT)

const { data, pending, error, refresh } = usePress(
  typeQueryRef,
  tagQueryRef,
  LIMIT,
  offset,
  searchQuery
)

const articles = computed(() => data.value?.data ?? [])
const total = computed(() => data.value?.meta.total ?? 0)
const pageCount = computed(() => Math.ceil(total.value / LIMIT))
const showErrorState = computed(() => Boolean(error.value) && articles.value.length === 0)
const emptyMessage = computed(() =>
  searchQuery.value ? t('press.news.emptySearch') : t('press.news.empty')
)

const { resultsRef, isLoading, isRefreshing } = usePaginatedTransition(pending, articles, error)

const toggleType = (pressType: PressArticleType) => {
  const current = selectedTypes.value
  const idx = current.indexOf(pressType)
  const next = idx >= 0 ? current.filter((t) => t !== pressType) : [...current, pressType]
  typeParam.value = next.length > 0 ? next.join(',') : null
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

const typeSelectItems = computed(() => [
  {
    value: ALL_TYPES_VALUE,
    label: t('press.news.allTypes'),
    icon: 'i-tabler-list',
  },
  ...PRESS_ARTICLE_TYPES.map((pressType) => ({
    value: pressType,
    label: typeLabels[pressType],
    icon: typeIcons[pressType],
  })),
])

const selectedTypeSelectValues = computed(() =>
  selectedTypes.value.length > 0 ? selectedTypes.value : [ALL_TYPES_VALUE]
)

const tagSelectItems = computed(() => [
  {
    value: ALL_TAGS_VALUE,
    label: t('press.news.allTags'),
  },
  ...(tagsData.value?.data ?? []).map((tag) => ({
    value: tag.slug,
    label: tag.name,
  })),
])

const selectedTagSelectValues = computed(() =>
  selectedTags.value.length > 0 ? selectedTags.value : [ALL_TAGS_VALUE]
)

const updateMobileTypeSelection = (values: string[] | undefined) => {
  const nextValues = values ?? []
  const currentShowsAll = selectedTypes.value.length === 0
  const validTypes = nextValues.filter((value): value is PressArticleType =>
    (PRESS_ARTICLE_TYPES as readonly string[]).includes(value)
  )

  if (nextValues.includes(ALL_TYPES_VALUE) && !currentShowsAll) {
    typeParam.value = null
  } else {
    typeParam.value = validTypes.length > 0 ? validTypes.join(',') : null
  }

  page.value = 1
}

const updateMobileTagSelection = (values: string[] | undefined) => {
  const nextValues = values ?? []
  const currentShowsAll = selectedTags.value.length === 0
  const availableSlugs = new Set((tagsData.value?.data ?? []).map((tag) => tag.slug))
  const validTags = nextValues.filter((value) => availableSlugs.has(value))

  if (nextValues.includes(ALL_TAGS_VALUE) && !currentShowsAll) {
    tagQuery.value = null
  } else {
    tagQuery.value = validTags.length > 0 ? validTags.join(',') : null
  }

  page.value = 1
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
        <div class="space-y-2 lg:hidden">
          <USelectMenu
            :model-value="selectedTypeSelectValues"
            :items="typeSelectItems"
            value-key="value"
            multiple
            icon="i-tabler-category"
            class="w-full min-w-0"
            :aria-label="t('press.news.filterByType')"
            :placeholder="t('press.news.filterByType')"
            :ui="{ placeholder: 'truncate text-muted', itemLabel: 'truncate' }"
            @update:model-value="updateMobileTypeSelection"
          />

          <USelectMenu
            :model-value="selectedTagSelectValues"
            :items="tagSelectItems"
            value-key="value"
            multiple
            icon="i-tabler-tags"
            class="w-full min-w-0"
            :aria-label="t('press.news.filterByTag')"
            :placeholder="t('press.news.filterByTag')"
            :disabled="tagsPending"
            :ui="{ placeholder: 'truncate text-muted', itemLabel: 'truncate' }"
            @update:model-value="updateMobileTagSelection"
          />
        </div>

        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            class="hidden flex-wrap items-center gap-2 lg:flex"
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

          <UInput
            v-model="searchInput"
            class="w-full lg:max-w-sm lg:min-w-80"
            icon="i-tabler-search"
            size="lg"
            type="search"
            :placeholder="t('press.news.searchPlaceholder')"
            :aria-label="t('press.news.searchLabel')"
          >
            <template v-if="searchInput" #trailing>
              <UButton
                type="button"
                color="neutral"
                variant="link"
                size="sm"
                icon="i-tabler-x"
                :aria-label="t('press.news.clearSearch')"
                @click="searchInput = ''"
              />
            </template>
          </UInput>
        </div>

        <HomeTagSelector
          :tags="tagsData?.data ?? []"
          :pending="tagsPending"
          :selected-slugs="selectedTags"
          :aria-label="t('press.news.filterByTag')"
          class="mt-2 hidden lg:block"
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
                <AdaptiveImage
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
