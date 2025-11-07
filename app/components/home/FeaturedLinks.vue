<script setup lang="ts">
/**
 * UsefulLinksRow
 * Renders a row of "links of interest" (image + title).
 * - Auto-wraps to multiple rows on small screens.
 * - Each card is a compact tile; good for 4–8 links.
 */

type LinkItem = {
  title: string // Localized already
  image: string // Thumbnail or small banner
  to: string // Internal or external link
  alt?: string
}

const props = defineProps<{
  items: LinkItem[]
}>()
</script>

<template>
  <section aria-labelledby="featured-links-heading" class="py-4 sm:py-6">
    <UContainer>
      <header class="mb-3 flex items-center justify-between sm:mb-5">
        <h2 id="featured-links-heading" class="text-lg font-semibold sm:text-xl">
          {{ $t('home.featuredLinks') }}
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
          class="overflow-hidden rounded-xl bg-white/5 ring-1 ring-black/5"
        >
          <USkeleton class="aspect-square" />
          <div class="p-2.5 sm:p-3">
            <USkeleton class="h-4 w-3/4" />
          </div>
        </div>
      </div>

      <!-- Responsive tiles: 2 / 3 / 6 columns depending on width -->
      <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
        <NuxtLink
          v-for="(item, idx) in props.items"
          :key="idx"
          :to="item.to"
          class="group focus-visible:ring-primary/60 overflow-hidden rounded-xl bg-white/5 ring-1 ring-black/5 hover:ring-black/10 focus:outline-none focus-visible:ring-2"
          :aria-label="item.title"
        >
          <div class="aspect-square bg-neutral-200 dark:bg-neutral-800">
            <img
              :src="item.image"
              :alt="item.alt || item.title"
              class="size-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
          <div class="flex items-start justify-between gap-2 p-2.5 sm:p-3">
            <p class="line-clamp-2 text-sm leading-tight font-medium">
              {{ item.title }}
            </p>
            <UIcon
              name="i-tabler-external-link"
              class="mt-0.5 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
            />
          </div>
        </NuxtLink>
      </div>
    </UContainer>
  </section>
</template>
