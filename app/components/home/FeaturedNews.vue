<script setup lang="ts">
/**
 * FeaturedNewsRow
 * Renders featured news (title + cover) as clickable cards.
 * - Images are constrained with a 16:9 ratio and object-cover.
 * - Uses NuxtLink for navigation and UIcon for subtle affordances.
 * - Section title comes from i18n.
 */
import { useNews } from '@/composables/useNews'

type NewsItem = {
  /** Localized title (already in the current locale) */
  title: string
  /** Image URL (public/ or external) */
  image: string
  /** Route location or external URL */
  to: string
  /** Optional alt text for accessibility */
  alt?: string
}

const props = defineProps<{
  items?: NewsItem[]
  /** Whether to show inline (without container wrapper) */
  inline?: boolean
}>()

const { t } = useI18n()

const hasProvidedItems = computed(() => Array.isArray(props.items))

// Selected tag for filtering
const selectedTag = ref<string>('all')

// Fetch news filtered by tag
const { data: newsData, pending } = useNews(selectedTag)

// Use props.items if provided, otherwise use filtered news from API
const displayItems = computed(() => {
  if (props.items && props.items.length > 0) {
    return props.items
  }
  return (
    newsData.value?.news.map((n: { title: string; image: string; to: string }) => ({
      title: n.title,
      image: n.image,
      to: n.to,
    })) ?? []
  )
})

const isLoading = computed(() => {
  if (hasProvidedItems.value) return false
  return pending.value || newsData.value == null
})

const onTagSelect = (tagSlug: string) => {
  selectedTag.value = tagSlug
}
</script>

<template>
  <section aria-labelledby="featured-news-heading" class="h-full">
    <div
      :class="{
        'bg-surface/50 rounded-2xl p-4 ring-1 ring-gray-200/50 sm:p-5 dark:ring-gray-800/50':
          inline,
      }"
      class="flex h-full flex-col"
    >
      <header class="mb-4 flex items-center justify-between">
        <h2 id="featured-news-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.latestNews') }}
        </h2>
      </header>

      <!-- Tag selector sits between the heading and the news grid -->
      <HomeTagSelector class="mb-4" @select="onTagSelect" />

      <!-- Loading skeleton grid -->
      <div
        v-if="isLoading"
        aria-hidden="true"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
      >
        <USkeleton v-for="n in 4" :key="n" class="h-48 rounded-xl sm:h-72" />
      </div>

      <!-- No results message -->
      <div
        v-else-if="!displayItems.length"
        class="text-muted flex flex-1 items-center justify-center py-12 text-center"
      >
        <p>{{ t('home.noNews') }}</p>
      </div>

      <!-- Responsive grid: 1 / 2 columns -->
      <ul v-else class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" role="list">
        <li v-for="(item, idx) in displayItems" :key="idx">
          <a
            :href="item.to"
            class="group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface block overflow-hidden rounded-xl ring-1 ring-gray-200/50 transition-shadow focus:outline-none focus-visible:ring-2 dark:ring-gray-800/50"
          >
            <!-- Cover -->
            <div class="bg-muted aspect-video">
              <NuxtImg
                :src="item.image"
                alt=""
                width="640"
                height="360"
                class="size-full object-cover"
                loading="lazy"
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
            </div>
          </a>
        </li>
      </ul>
    </div>
  </section>
</template>
