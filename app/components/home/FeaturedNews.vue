<script setup lang="ts">
import type { PressArticle } from '@/composables/usePress'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

type NewsItem = {
  title: string
  image: string | null
  to: string
  alt?: string
  description?: string
  mediaOutletName?: string
  mediaOutletLogo?: string
}

const props = defineProps<{
  items?: NewsItem[]
  inline?: boolean
  pending?: boolean
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const hasProvidedItems = computed(() => Array.isArray(props.items) && selectedTag.value === null)
const loadedImageKeys = reactive<Record<string, boolean>>({})

const selectedTag = ref<string | null>(null)
const shouldFetchPress = computed(() => !hasProvidedItems.value)
const { data: pressData, pending: pressPending } = usePress(null, selectedTag, 4, undefined, {
  enabled: shouldFetchPress,
})

const displayItems = computed<NewsItem[]>(() => {
  if (hasProvidedItems.value && props.items && props.items.length > 0) {
    return props.items
  }
  return (
    pressData.value?.items.map((a: PressArticle) => ({
      title: a.title,
      image: a.image,
      to: `${getPressArticlePublicListPath(a.type)}/${a.slug}`,
      alt: a.alt || undefined,
      description: a.description || undefined,
      mediaOutletName: a.mediaOutlet?.name,
      mediaOutletLogo: a.mediaOutlet?.logo,
    })) ?? []
  )
})

const isLoading = computed(() => {
  if (props.pending) return true
  if (hasProvidedItems.value) return false
  return pressPending.value || pressData.value == null
})

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

const getItemKey = (item: NewsItem) => `${item.to}::${item.image}`

const markItemImageAsLoaded = (item: NewsItem) => {
  loadedImageKeys[getItemKey(item)] = true
}

const isItemImageLoaded = (item: NewsItem) => loadedImageKeys[getItemKey(item)] === true

const onTagSelect = (tagSlug: string | null) => {
  selectedTag.value = tagSlug
}
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
      <header class="mb-4 flex items-center justify-between">
        <h2 id="featured-news-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.latestNews') }}
        </h2>
      </header>

      <HomeTagSelector :selected-slug="selectedTag" class="mb-4" @select="onTagSelect" />

      <div class="flex-1" aria-live="polite">
        <div
          v-if="isLoading"
          aria-hidden="true"
          class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        >
          <USkeleton v-for="n in 4" :key="n" class="h-48 rounded-xl sm:h-72" />
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
                  loading="lazy"
                  @load="markItemImageAsLoaded(item)"
                />
                <div
                  v-else
                  class="text-muted flex size-full items-center justify-center"
                  aria-hidden="true"
                >
                  <UIcon name="i-tabler-news" class="size-12" />
                </div>
                <div
                  v-if="item.image && item.mediaOutletLogo && isItemImageLoaded(item)"
                  class="bg-background/70 absolute right-2 bottom-2 rounded p-1 backdrop-blur-sm"
                >
                  <NuxtImg
                    :src="item.mediaOutletLogo"
                    :alt="item.mediaOutletName ?? ''"
                    width="64"
                    height="16"
                    class="block h-4 w-auto"
                    loading="lazy"
                  />
                </div>
              </div>
              <div class="p-3">
                <UTooltip :text="item.title">
                  <h3
                    class="group-hover:text-primary text-sm leading-snug font-medium transition-colors sm:line-clamp-2 sm:text-base"
                  >
                    {{ item.title }}
                  </h3>
                </UTooltip>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>
