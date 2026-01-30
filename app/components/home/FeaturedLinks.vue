<script setup lang="ts">
/**
 * FeaturedLinksRow
 * Renders a row of "links of interest" (image + title).
 * - Auto-wraps to multiple rows on small screens.
 * - Each card is a compact tile; good for 4–8 links.
 */

type LinkItem = {
  /** Localized title */
  title: string
  /** Thumbnail or small banner */
  image: string
  /** Internal or external link */
  to: string
  /** Optional alt text for accessibility */
  alt?: string
}

const props = defineProps<{
  items: LinkItem[]
}>()

const { t } = useI18n()
</script>

<template>
  <section aria-labelledby="featured-links-heading" class="py-4 sm:py-6">
    <UContainer>
      <header class="mb-3 flex items-center justify-between sm:mb-5">
        <h2 id="featured-links-heading" class="text-xl font-semibold sm:text-2xl">
          {{ t('home.featuredLinks') }}
        </h2>
      </header>

      <!-- Loading skeleton tiles -->
      <div
        v-if="!props.items.length"
        aria-hidden="true"
        class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="bg-surface/50 overflow-hidden rounded-xl ring-1 ring-gray-200/50 dark:ring-gray-800/50"
        >
          <USkeleton class="aspect-square" />
          <div class="p-2.5 sm:p-3">
            <USkeleton class="h-4 w-3/4" />
          </div>
        </div>
      </div>

      <!-- Responsive tiles: 2 / 3 / 6 columns depending on width -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6" role="list">
        <NuxtLink
          v-for="(item, idx) in props.items"
          :key="idx"
          :to="item.to"
          class="group focus-visible:ring-primary/60 bg-surface/50 hover:bg-surface overflow-hidden rounded-xl ring-1 ring-gray-200/50 focus:outline-none focus-visible:ring-2 dark:ring-gray-800/50"
          role="listitem"
          :target="item.to.startsWith('http') ? '_blank' : undefined"
          :rel="item.to.startsWith('http') ? 'noopener noreferrer' : undefined"
        >
          <div class="bg-muted aspect-square">
            <NuxtImg
              :src="item.image"
              :alt="item.alt || item.title"
              width="288"
              height="288"
              class="size-full object-cover"
              loading="lazy"
            />
          </div>
          <div class="flex items-start justify-between gap-2 p-2.5 sm:p-3">
            <p
              class="group-hover:text-primary line-clamp-2 text-sm leading-tight font-medium transition-colors"
            >
              {{ item.title }}
            </p>
            <UIcon
              name="i-tabler-external-link"
              class="mt-0.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
          </div>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
