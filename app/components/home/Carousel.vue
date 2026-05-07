<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { CarouselItem } from '@/composables/home/useHome'
import { isExternalNavigationTarget } from '~~/shared/utils/url'

const props = withDefaults(
  defineProps<{
    items: CarouselItem[]
    pending?: boolean
    error?: boolean
  }>(),
  {
    pending: false,
    error: false,
  }
)
const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
const carouselImageSizes = 'xs:100vw sm:100vw md:100vw lg:100vw xl:1280px'

const autoplay = computed(() => {
  if (props.items.length <= 1 || prefersReducedMotion.value) return false
  return { delay: 10000, stopOnMouseEnter: true, stopOnFocusIn: true }
})

const getImageFormat = (src?: string) => (src?.toLowerCase().endsWith('.svg') ? undefined : 'webp')
</script>

<template>
  <section
    v-if="props.pending || props.error || props.items.length"
    aria-labelledby="carousel-heading"
    class="relative mb-6 sm:mb-10"
  >
    <h2 id="carousel-heading" class="sr-only">{{ t('home.carousel.label') }}</h2>

    <UContainer>
      <USkeleton v-if="props.pending" class="mt-5 mb-10 h-62 w-full rounded-xl sm:mb-20 sm:h-100" />

      <div v-else-if="props.error" class="mt-5 mb-10 space-y-3 sm:mb-20">
        <UAlert
          color="error"
          variant="soft"
          :title="t('home.carousel.loadError')"
          :description="t('error.message')"
        />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="emit('retry')">
          {{ t('home.retry') }}
        </UButton>
      </div>

      <UCarousel
        v-else
        v-slot="{ item, index }"
        :loop="props.items.length > 1"
        :dots="props.items.length > 1"
        :arrows="false"
        auto-height
        :autoplay="autoplay"
        :items="props.items"
        :ui="{
          container: 'transition-[height] overflow-visible',
          item: 'basis-full overflow-visible px-1 pb-px',
          prev: 'hidden sm:flex sm:inset-s-4 top-1/2 -translate-y-1/2',
          next: 'hidden sm:flex sm:inset-e-4 top-1/2 -translate-y-1/2',
          dots: '-bottom-3',
        }"
        class="mt-5 w-full overflow-visible pb-5"
      >
        <article class="border-default flex flex-col overflow-hidden rounded-xl border">
          <div class="bg-muted relative aspect-1925/550 w-full overflow-hidden">
            <NuxtImg
              v-if="item.image"
              :src="item.image"
              :alt="item.alt || ''"
              width="1925"
              height="550"
              class="size-full object-cover"
              :loading="index === 0 ? 'eager' : 'lazy'"
              decoding="async"
              :sizes="carouselImageSizes"
              quality="72"
              :format="getImageFormat(item.image)"
            />
            <div
              v-else
              class="bg-muted flex size-full min-h-40 items-center justify-center sm:min-h-55"
              aria-hidden="true"
            />
          </div>

          <div
            class="bg-surface/70 flex min-h-28 flex-col justify-end p-4 transition-[height] duration-300 ease-in-out sm:min-h-0 sm:p-5"
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
                {{ item.buttonText || t('home.carousel.defaultButtonText') }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </a>
              <NuxtLink
                v-else-if="item.href"
                :to="localePath(item.href)"
                class="bg-primary text-inverted ring-primary/60 hover:bg-primary/90 inline-flex w-full items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 sm:w-auto sm:shrink-0"
              >
                {{ item.buttonText || t('home.carousel.defaultButtonText') }}
                <UIcon name="i-tabler-arrow-right" class="ml-1" aria-hidden="true" />
              </NuxtLink>
            </div>
          </div>
        </article>
      </UCarousel>
    </UContainer>
  </section>
</template>
