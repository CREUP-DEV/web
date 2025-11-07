<script setup lang="ts">
/**
 * FeaturedNewsRow
 * Renders 4 featured news (title + cover) as clickable cards.
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
}>()
</script>

<template>
  <section aria-labelledby="featured-news-heading" class="py-6 sm:py-8">
    <UContainer>
      <header class="mb-4 flex items-center justify-between sm:mb-6">
        <h2 id="featured-news-heading" class="text-xl font-semibold sm:text-2xl">
          {{ $t('home.latestNews') }}
        </h2>
      </header>

      <!-- Loading skeleton grid -->
      <div
        v-if="!props.items.length"
        aria-hidden="true"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4"
      >
        <USkeleton v-for="n in 4" :key="n" class="h-56 rounded-2xl sm:h-60" />
      </div>

      <!-- Responsive grid: 1 / 2 / 4 columns -->
      <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <NuxtLink
          v-for="(item, idx) in props.items"
          :key="idx"
          :to="item.to"
          class="group focus-visible:ring-primary/60 overflow-hidden rounded-2xl bg-white/5 ring-1 ring-black/5 transition-shadow hover:ring-black/10 focus:outline-none focus-visible:ring-2"
          :aria-label="item.title"
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
          <div class="flex items-start justify-between gap-3 p-3 sm:p-4">
            <h3 class="line-clamp-2 text-base leading-snug font-medium sm:text-[1.05rem]">
              {{ item.title }}
            </h3>
            <UIcon
              name="i-tabler-arrow-up-right"
              class="mt-1 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
            />
          </div>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
