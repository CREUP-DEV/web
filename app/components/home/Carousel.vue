<script setup lang="ts">
/**
 * HomeCarousel
 * Displays a hero carousel with images and captions.
 * - Expects images of 1920 × 550 px (aspect ratio ~3.49:1).
 * - Navigation buttons inside the carousel, hidden on mobile, visible on desktop.
 * - Caption with CTA button always positioned below the image.
 * - Uses NuxtImg for optimized image loading.
 */
import type { MockDataCarouselItem } from '@/composables/useMockData'

const props = defineProps<{ items: MockDataCarouselItem[] }>()

const { t } = useI18n()
</script>

<template>
  <section aria-labelledby="carousel-heading" class="relative mb-6 sm:mb-10">
    <h2 id="carousel-heading" class="sr-only">{{ t('home.carousel.label') }}</h2>

    <UContainer>
      <!-- Loading skeleton -->
      <USkeleton v-if="!props.items.length" class="mt-5 h-62 w-full rounded-xl sm:h-80" />

      <UCarousel
        v-else
        v-slot="{ item }"
        :key="props.items.length"
        loop
        dots
        arrows
        auto-height
        :autoplay="{ delay: 10000 }"
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
          <!-- Image container with 1920×550 aspect ratio -->
          <div
            class="relative aspect-192/55 w-full overflow-hidden rounded-t-xl bg-neutral-200 dark:bg-neutral-800"
          >
            <NuxtImg
              :src="item.image"
              :alt="item.title"
              width="1920"
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
            class="flex min-h-28 grow flex-col justify-end rounded-b-xl bg-neutral-100 p-4 transition-[height] duration-300 ease-in-out sm:min-h-0 sm:grow-0 sm:p-5 dark:bg-neutral-800"
          >
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p
                class="text-base leading-relaxed font-medium whitespace-pre-line text-neutral-800 sm:text-lg dark:text-neutral-100"
              >
                {{ item.title }}
              </p>
              <UButton
                v-if="item.href"
                :to="item.href"
                color="primary"
                size="md"
                class="w-full justify-center sm:w-auto sm:shrink-0"
              >
                {{ item.buttonText }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </UButton>
            </div>
          </div>
        </article>
      </UCarousel>
    </UContainer>
  </section>
</template>
