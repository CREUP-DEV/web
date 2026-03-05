<script setup lang="ts">
/**
 * FeaturedNewsRow
 * Renders the latest press articles (all types combined) as clickable cards.
 * - Images are constrained with a 16:9 ratio and object-cover.
 * - Uses NuxtLink for navigation and UIcon for subtle affordances.
 * - Section title comes from i18n.
 */
import type { PressArticle, PressArticleType } from '@/composables/usePress'

type NewsItem = {
  /** Localized title (already in the current locale) */
  title: string
  /** Image URL (public/ or external) */
  image: string
  /** Route location or external URL */
  to: string
  /** Optional alt text for accessibility */
  alt?: string
  /** Optional description */
  description?: string
  /** Optional media outlet name */
  mediaOutletName?: string
  /** Optional media outlet logo */
  mediaOutletLogo?: string
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

// Fetch all press articles (all types combined) filtered by tag
const { data: pressData, pending } = usePress(null, selectedTag, 4)

const typeUrlPrefix: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

// Use props.items if provided, otherwise use press articles from API
const displayItems = computed<NewsItem[]>(() => {
  if (props.items && props.items.length > 0) {
    return props.items
  }
  return (
    pressData.value?.articles.map((a: PressArticle) => ({
      title: a.title,
      image: a.image,
      to: `${typeUrlPrefix[a.type]}/${a.slug}`,
      alt: a.alt || undefined,
      description: a.description || undefined,
      mediaOutletName: a.mediaOutlet?.name,
      mediaOutletLogo: a.mediaOutlet?.logo,
    })) ?? []
  )
})

const isLoading = computed(() => {
  if (hasProvidedItems.value) return false
  return pending.value || pressData.value == null
})

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

      <!-- Responsive grid with special handling for 1 and 3 visible items -->
      <ul v-else class="grid flex-1 gap-3 sm:gap-4" :class="newsGridClass" role="list">
        <li v-for="(item, idx) in displayItems" :key="idx" :class="newsItemClass(idx)">
          <NuxtLink
            :to="item.to"
            class="group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface block overflow-hidden rounded-xl ring-1 ring-gray-200/50 transition-shadow focus:outline-none focus-visible:ring-2 dark:ring-gray-800/50"
          >
            <!-- Cover -->
            <div class="bg-muted relative aspect-video">
              <NuxtImg
                :src="item.image"
                :alt="item.alt ?? ''"
                width="640"
                height="360"
                class="size-full object-cover"
                loading="lazy"
              />
              <!-- Media outlet logo overlay -->
              <div
                v-if="item.mediaOutletLogo"
                class="absolute right-2 bottom-2 rounded bg-white/70 p-1 backdrop-blur-sm"
              >
                <img
                  :src="item.mediaOutletLogo"
                  :alt="item.mediaOutletName ?? ''"
                  class="block h-4 w-auto"
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
  </section>
</template>
