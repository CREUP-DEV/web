<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

type NewsItem = {
  title: string
  image: string | null
  to: string
  alt?: string
  description?: string
  tags: Array<{
    slug: string
    name: string
  }>
  mediaOutletName?: string
  mediaOutletLogo?: string | null
}

const props = defineProps<{
  items?: NewsItem[]
  inline?: boolean
  pending?: boolean
  error?: unknown | null
}>()
const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const loadedImageKeys = reactive<Record<string, boolean>>({})
const visibleTagCounts = reactive(new Map<string, number>())
const tagContainerElements = new Map<string, HTMLElement>()
const tagResizeObservers = new Map<string, ResizeObserver>()
const displayItems = computed<NewsItem[]>(() => props.items ?? [])
const maxVisibleTagCount = 2
const regularNewsImageSizes = 'xs:100vw sm:50vw md:50vw lg:50vw xl:608px'
const featuredNewsImageSizes = 'xs:100vw sm:100vw md:100vw lg:100vw xl:1248px'

const isLoading = computed(() => {
  return props.pending === true
})

const hasLoadError = computed(() => Boolean(props.error))

const retryLoad = async () => {
  emit('retry')
}

const getLocalizedItemLink = (to: string) => (to.startsWith('/') ? localePath(to) : to)

const visibleNewsCount = computed(() => displayItems.value.length)

const newsGridClass = computed(() => {
  if (visibleNewsCount.value <= 1) {
    return 'grid-cols-1 sm:mx-auto sm:max-w-2xl'
  }

  return 'grid-cols-1 sm:grid-cols-2'
})

const newsItemClass = (index: number) => {
  if (visibleNewsCount.value === 3 && index === 2) {
    return 'sm:col-span-2'
  }

  return ''
}

const getImageSizes = (index: number) => {
  if (visibleNewsCount.value === 3 && index === 2) {
    return featuredNewsImageSizes
  }

  return regularNewsImageSizes
}

const getItemKey = (item: NewsItem) => `${item.to}::${item.image}`

const markItemImageAsLoaded = (item: NewsItem) => {
  loadedImageKeys[getItemKey(item)] = true
}

const isItemImageLoaded = (item: NewsItem) => loadedImageKeys[getItemKey(item)] === true

const getDefaultVisibleTagCount = (item: NewsItem) => Math.min(item.tags.length, maxVisibleTagCount)

const getVisibleTagCount = (item: NewsItem) => {
  return visibleTagCounts.get(getItemKey(item)) ?? getDefaultVisibleTagCount(item)
}

const getVisibleTags = (item: NewsItem) => item.tags.slice(0, getVisibleTagCount(item))
const getHiddenTagCount = (item: NewsItem) => {
  return Math.max(0, item.tags.length - getVisibleTagCount(item))
}

const clearTagOverflowState = (itemKey: string) => {
  tagResizeObservers.get(itemKey)?.disconnect()
  tagResizeObservers.delete(itemKey)
  tagContainerElements.delete(itemKey)
  visibleTagCounts.delete(itemKey)
}

const syncVisibleTagCount = async (item: NewsItem) => {
  const itemKey = getItemKey(item)
  const container = tagContainerElements.get(itemKey)

  if (!container) {
    return
  }

  let nextVisibleTagCount = getDefaultVisibleTagCount(item)
  visibleTagCounts.set(itemKey, nextVisibleTagCount)

  await nextTick()

  while (nextVisibleTagCount > 0 && container.scrollWidth > container.clientWidth) {
    nextVisibleTagCount -= 1
    visibleTagCounts.set(itemKey, nextVisibleTagCount)
    await nextTick()
  }
}

const syncAllVisibleTagCounts = async () => {
  const activeItemKeys = new Set(displayItems.value.map((item) => getItemKey(item)))

  for (const itemKey of Array.from(tagContainerElements.keys())) {
    if (!activeItemKeys.has(itemKey)) {
      clearTagOverflowState(itemKey)
    }
  }

  await Promise.all(displayItems.value.map((item) => syncVisibleTagCount(item)))
}

const setTagContainerRef = (item: NewsItem) => {
  return (element: Element | ComponentPublicInstance | null) => {
    const itemKey = getItemKey(item)

    if (!(element instanceof HTMLElement)) {
      clearTagOverflowState(itemKey)
      return
    }

    const currentElement = tagContainerElements.get(itemKey)

    if (currentElement === element) {
      return
    }

    tagResizeObservers.get(itemKey)?.disconnect()
    tagContainerElements.set(itemKey, element)

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        void syncVisibleTagCount(item)
      })

      observer.observe(element)
      tagResizeObservers.set(itemKey, observer)
    }

    void syncVisibleTagCount(item)
  }
}

watch(
  displayItems,
  async () => {
    await nextTick()
    await syncAllVisibleTagCounts()
  },
  { deep: true, immediate: true }
)

onBeforeUnmount(() => {
  for (const itemKey of Array.from(tagResizeObservers.keys())) {
    clearTagOverflowState(itemKey)
  }
})
</script>

<template>
  <section aria-labelledby="featured-news-heading" class="h-full">
    <div
      :class="{
        'bg-surface/50 ring-default rounded-2xl p-4 ring-1 sm:p-5': inline,
      }"
      :aria-busy="isLoading || undefined"
      class="flex h-full flex-col"
    >
      <header class="mb-4 flex items-center justify-between gap-3">
        <h2 id="featured-news-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.latestNews') }}
        </h2>
        <UButton
          :to="localePath('/prensa/noticias')"
          color="secondary"
          variant="outline"
          size="sm"
          class="shrink-0 rounded-full"
          trailing-icon="i-tabler-arrow-right"
        >
          {{ t('home.viewAllNews') }}
        </UButton>
      </header>

      <div class="flex-1" aria-live="polite">
        <div
          v-if="isLoading"
          aria-hidden="true"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        >
          <USkeleton v-for="n in 4" :key="n" class="h-48 rounded-xl sm:h-72" />
        </div>

        <div v-else-if="hasLoadError" class="space-y-3">
          <UAlert
            color="error"
            variant="soft"
            :title="t('home.newsLoadError')"
            :description="t('error.message')"
          />
          <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="retryLoad">
            {{ t('home.retry') }}
          </UButton>
        </div>

        <div
          v-else-if="!displayItems.length"
          class="text-muted flex flex-1 items-center justify-center py-12 text-center"
        >
          <p>{{ t('home.noNews') }}</p>
        </div>

        <ul v-else class="grid flex-1 gap-3 sm:gap-4" :class="newsGridClass" role="list">
          <li
            v-for="(item, idx) in displayItems"
            :key="getItemKey(item)"
            :class="newsItemClass(idx)"
          >
            <NuxtLink
              :to="getLocalizedItemLink(item.to)"
              class="motion-link-card group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface ring-default block overflow-hidden rounded-xl ring-1 focus:outline-none focus-visible:ring-2"
            >
              <div class="bg-muted relative aspect-video">
                <NuxtImg
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.alt ?? ''"
                  width="640"
                  height="360"
                  class="motion-link-media size-full object-cover"
                  :sizes="getImageSizes(idx)"
                  :loading="idx === 0 ? 'eager' : 'lazy'"
                  :fetchpriority="idx === 0 ? 'high' : undefined"
                  quality="72"
                  @load="markItemImageAsLoaded(item)"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-news" class="size-12" />
                </div>
                <PressMediaOutletLogoOverlay
                  v-if="item.image && item.mediaOutletLogo && isItemImageLoaded(item)"
                  :logo-url="item.mediaOutletLogo"
                  :outlet-name="item.mediaOutletName ?? ''"
                />
              </div>
              <div class="p-3">
                <UTooltip :text="item.title">
                  <h3
                    class="group-hover:text-primary text-sm leading-snug font-medium transition-colors sm:line-clamp-2 sm:text-base"
                  >
                    {{ item.title }}
                  </h3>
                </UTooltip>

                <div
                  v-if="item.tags.length"
                  :ref="setTagContainerRef(item)"
                  class="mt-2 flex min-w-0 flex-nowrap gap-1.5 overflow-hidden"
                >
                  <span
                    v-for="tag in getVisibleTags(item)"
                    :key="tag.slug"
                    class="bg-secondary/10 text-secondary shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap"
                  >
                    {{ tag.name }}
                  </span>
                  <span
                    v-if="getHiddenTagCount(item) > 0"
                    class="bg-secondary/10 text-secondary shrink-0 rounded-full px-2 py-0.5 text-xs whitespace-nowrap"
                  >
                    +{{ getHiddenTagCount(item) }}
                  </span>
                </div>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
