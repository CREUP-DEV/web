<script setup lang="ts">
/**
 * FeaturedNewsRow
 * Renders featured news (title + cover) as clickable cards.
 * - Images are constrained with a 16:9 ratio and object-cover.
 * - Uses NuxtLink for navigation and UIcon for subtle affordances.
 * - Section title comes from i18n.
 */

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
  items: NewsItem[]
  /** Whether to show inline (without container wrapper) */
  inline?: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <section aria-labelledby="featured-news-heading" class="h-full">
    <div
      :class="{
        'rounded-2xl bg-white/5 p-4 ring-1 ring-black/5 sm:p-5 dark:bg-neutral-900/50': inline,
      }"
      class="flex h-full flex-col"
    >
      <header class="mb-4 flex items-center justify-between">
        <h2 id="featured-news-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.latestNews') }}
        </h2>
      </header>

      <!-- Tag selector sits between the heading and the news grid -->
      <HomeTagSelector class="mb-4" />

      <!-- Loading skeleton grid -->
      <div
        v-if="!props.items.length"
        aria-hidden="true"
        class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
      >
        <USkeleton v-for="n in 4" :key="n" class="h-48 rounded-xl sm:h-52" />
      </div>

      <!-- Responsive grid: 1 / 2 columns -->
      <div v-else class="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4" role="list">
        <NuxtLink
          v-for="(item, idx) in props.items"
          :key="idx"
          :to="item.to"
          class="group focus-visible:ring-primary/60 overflow-hidden rounded-xl bg-white/5 ring-1 ring-black/5 transition-shadow hover:ring-black/10 focus:outline-none focus-visible:ring-2 dark:bg-neutral-800/50"
          role="listitem"
        >
          <!-- Cover -->
          <div class="aspect-video bg-neutral-200 dark:bg-neutral-800">
            <img
              :src="item.image"
              :alt="item.alt || item.title"
              class="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="flex items-start justify-between gap-2 p-3">
            <h3 class="line-clamp-2 text-sm leading-snug font-medium sm:text-base">
              {{ item.title }}
            </h3>
            <UIcon
              name="i-tabler-arrow-up-right"
              class="mt-0.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
