<script setup lang="ts">
/**
 * Home Page
 * Main landing page with carousel, news, agenda, and featured links.
 */
import { useMockData } from '@/composables/useMockData'

const { t } = useI18n()

const { data: mock } = useMockData()

const carouselItems = computed(() => mock.value?.carousel ?? [])
const news = computed(() => mock.value?.featuredNews ?? [])
const links = computed(() => mock.value?.featuredLinks ?? [])
const events = computed(() => mock.value?.events ?? [])

// SEO meta for home page
useSeoMeta({
  title: () => t('meta.title'),
  description: () => t('meta.description'),
  ogTitle: () => t('meta.title'),
  ogDescription: () => t('meta.description'),
  ogType: 'website',
  ogUrl: 'https://www.creup.es',
  ogImage: 'https://www.creup.es/img/og-image.png',
  twitterCard: 'summary_large_image',
  twitterTitle: () => t('meta.title'),
  twitterDescription: () => t('meta.description'),
})
</script>

<template>
  <div>
    <HomeCarousel :items="carouselItems" />

    <!-- News and Agenda side by side -->
    <section class="py-4 sm:py-0" aria-label="News and Events">
      <UContainer>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <!-- News column (2/3 width on desktop) -->
          <div class="lg:col-span-2">
            <HomeFeaturedNews :items="news" inline />
          </div>
          <!-- Agenda column (1/3 width on desktop) -->
          <aside class="lg:col-span-1">
            <HomePublicAgenda :events="events" />
          </aside>
        </div>
      </UContainer>
    </section>

    <HomeFeaturedLinks :items="links" />
  </div>
</template>
