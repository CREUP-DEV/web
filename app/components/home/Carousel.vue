<script setup lang="ts">
import type { CarouselItem } from '@/composables/useHomeData'
import { HOME_CAROUSEL_FALLBACK_IMAGE } from '~~/shared/constants/assetPaths'
import { isExternalNavigationTarget } from '~~/shared/utils/url'

const props = withDefaults(
  defineProps<{
    items: CarouselItem[]
    pending?: boolean
  }>(),
  {
    pending: false,
  }
)

const { t } = useI18n()
const localePath = useLocalePath()

const getImageFormat = (src?: string) => (src?.toLowerCase().endsWith('.svg') ? undefined : 'webp')
</script>

<template>
  <section
    v-if="props.pending || props.items.length"
    aria-labelledby="carousel-heading"
    class="relative mb-6 sm:mb-10"
  >
    <h2 id="carousel-heading" class="sr-only">{{ t('home.carousel.label') }}</h2>

    <UContainer>
      <USkeleton v-if="props.pending" class="mt-5 mb-10 h-62 w-full rounded-xl sm:mb-20 sm:h-100" />

      <UCarousel
        v-else
        v-slot="{ item, index }"
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
          prev: 'hidden sm:flex sm:inset-s-4 top-1/2 -translate-y-1/2',
          next: 'hidden sm:flex sm:inset-e-4 top-1/2 -translate-y-1/2',
          dots: '-bottom-3',
        }"
        class="mt-5 w-full pb-6"
      >
        <article class="flex h-full flex-col sm:h-auto">
          <div class="bg-muted relative aspect-1925/550 w-full overflow-hidden rounded-t-xl">
            <NuxtImg
              :src="item.image || HOME_CAROUSEL_FALLBACK_IMAGE"
              :alt="item.alt || item.title"
              width="1925"
              height="550"
              class="size-full object-cover"
              :loading="index === 0 ? 'eager' : 'lazy'"
              :fetchpriority="index === 0 ? 'high' : undefined"
              decoding="async"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
              :format="getImageFormat(item.image)"
            />
          </div>

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
                v-if="item.href && isExternalNavigationTarget(item.href)"
                :href="item.href"
                class="bg-primary text-inverted ring-primary/60 hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 sm:w-auto sm:shrink-0"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ item.buttonText }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </a>
              <NuxtLink
                v-else-if="item.href"
                :to="localePath(item.href)"
                class="bg-primary text-inverted ring-primary/60 hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 sm:w-auto sm:shrink-0"
              >
                {{ item.buttonText }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </article>
      </UCarousel>
    </UContainer>
  </section>
</template>
