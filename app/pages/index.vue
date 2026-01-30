<script setup lang="ts">
/**
 * Home Page
 * Main landing page with carousel, news, agenda, and featured links.
 */
import { useHomeData } from '@/composables/useHomeData'
import { useGoogleCalendar } from '@/composables/useGoogleCalendar'

const { t } = useI18n()

const { data: homeData } = useHomeData()
const { events, isLoading: eventsLoading } = useGoogleCalendar()

const carouselItems = computed(() => homeData.value?.carousel ?? [])
const links = computed(() => homeData.value?.featuredLinks ?? [])

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
    <section class="py-4 sm:py-0" :aria-label="t('home.newsAndEventsLabel')">
      <UContainer>
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <!-- News column (2/3 width on desktop) -->
          <div class="lg:col-span-2">
            <HomeFeaturedNews inline />
          </div>
          <!-- Agenda column (1/3 width on desktop) -->
          <aside class="lg:col-span-1">
            <HomePublicAgenda :events="events" :pending="eventsLoading" />
          </aside>
        </div>
      </UContainer>
    </section>

    <HomeFeaturedLinks :items="links" />
  </div>
</template>
