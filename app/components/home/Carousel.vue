<script setup lang="ts">
/**
 * HomeCarousel
 * Displays a hero carousel with images and captions.
 * - Expects images of 1925 × 550 px (aspect ratio 3.5:1).
 * - Navigation buttons inside the carousel, hidden on mobile, visible on desktop.
 * - Caption with CTA button always positioned below the image.
 * - Uses NuxtImg for optimized image loading.
 */
import type { CarouselItem } from '@/composables/useHomeData'

const props = defineProps<{ items: CarouselItem[] }>()

const { t } = useI18n()
</script>

<template>
  <section aria-labelledby="carousel-heading" class="relative mb-6 sm:mb-10">
    <h2 id="carousel-heading" class="sr-only">{{ t('home.carousel.label') }}</h2>

    <UContainer>
      <!-- Loading skeleton -->
      <USkeleton
        v-if="!props.items.length"
        class="mt-5 mb-10 h-62 w-full rounded-xl sm:mb-20 sm:h-100"
      />

      <UCarousel
        v-else
        v-slot="{ item }"
        :key="props.items.length"
        :loop="props.items.length > 1"
        :dots="props.items.length > 1"
        :arrows="false"
        auto-height
        :autoplay="props.items.length > 1 ? { delay: 10000 } : false"
        :items="props.items"
        :ui="{
          container: 'transition-[height]',
          item: 'basis-full h-full sm:h-auto',
          prev: 'hidden sm:flex sm:start-4 top-1/2 -translate-y-1/2',
          next: 'hidden sm:flex sm:end-4 top-1/2 -translate-y-1/2',
          dots: '-bottom-3',
        }"
        class="mt-5 w-full pb-6"
      >
        <article class="flex h-full flex-col sm:h-auto">
          <!-- Image container with 1925×550 aspect ratio -->
          <div class="bg-muted relative aspect-1925/550 w-full overflow-hidden rounded-t-xl">
            <NuxtImg
              :src="item.image || '/img/carousel/default.jpg'"
              :alt="item.alt || item.title"
              width="1925"
              height="550"
              class="size-full object-cover"
              loading="lazy"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
              format="webp"
            />
          </div>

          <!-- Caption always below the image - grows to fill available space -->
          <div
            class="bg-surface/70 flex min-h-28 grow flex-col justify-end rounded-b-xl border border-gray-200/70 p-4 ring-1 ring-gray-200/40 transition-[height] duration-300 ease-in-out sm:min-h-0 sm:grow-0 sm:p-5 dark:border-gray-800/70 dark:ring-gray-800/40"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                class="text-foreground text-base leading-relaxed font-medium whitespace-pre-line sm:text-lg"
              >
                {{ item.title }}
              </p>
              <a
                v-if="item.href"
                :href="item.href"
                class="bg-primary text-inverted ring-primary/60 hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 sm:w-auto sm:shrink-0"
                :target="item.href.startsWith('http') ? '_blank' : undefined"
                :rel="item.href.startsWith('http') ? 'noopener noreferrer' : undefined"
              >
                {{ item.buttonText }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </a>
            </div>
          </div>
        </article>
      </UCarousel>
    </UContainer>
  </section>
</template>
