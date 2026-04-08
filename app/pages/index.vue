<script setup lang="ts">
import { useHomeData } from '@/composables/useHomeData'
import { useGoogleCalendar } from '@/composables/useGoogleCalendar'

const { t } = useI18n()

const { data: homeData, pending: homeDataPending } = useHomeData()
const { events, isLoading: eventsLoading } = useGoogleCalendar()

const carouselItems = computed(() => homeData.value?.carousel ?? [])
const links = computed(() => homeData.value?.featuredLinks ?? [])

defineOgImage('NuxtSeoSatori', {
  title: t('meta.title'),
  description: t('meta.description'),
})

usePageSeo('meta.title', 'meta.description')
useSeoMeta({
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <div>
    <h1 class="sr-only">{{ t('meta.title') }}</h1>

    <HomeCarousel :items="carouselItems" :pending="homeDataPending" />

    <section class="py-4 sm:py-0" :aria-label="t('home.newsAndEventsLabel')">
      <UContainer>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
          <div class="md:col-span-2">
            <HomeFeaturedNews inline />
          </div>
          <div class="md:col-span-1">
            <HomePublicAgenda :events="events" :pending="eventsLoading" />
          </div>
        </div>
      </UContainer>
    </section>

    <HomeFeaturedLinks :items="links" :pending="homeDataPending" />
  </div>
</template>
