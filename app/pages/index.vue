<script setup lang="ts">
import { useHome } from '@/composables/home/useHome'
import { useGoogleCalendar } from '@/composables/events/useGoogleCalendar'

const { t, locale } = useI18n()
const localePath = useLocalePath()

const { data: home, pending: homePending, error: homeError, refresh: refreshHome } = await useHome()
const {
  events,
  pending: eventsLoading,
  error: eventsError,
  refresh: refreshEvents,
} = useGoogleCalendar()
const carouselItems = computed(() => home.value?.data.carousel ?? [])
const links = computed(() => home.value?.data.featuredLinks ?? [])
const hasHomeError = computed(() => Boolean(homeError.value))
const hasCarouselSection = computed(
  () => homePending.value || !!homeError.value || carouselItems.value.length > 0
)
const hasFeaturedLinksSection = computed(
  () => homePending.value || !!homeError.value || links.value.length > 0
)
const newsAndEventsSectionClass = computed(() => ({
  'pt-8 sm:pt-10': !hasCarouselSection.value,
  'pb-8 sm:pb-10': !hasFeaturedLinksSection.value,
  'py-4 sm:py-0': hasCarouselSection.value && hasFeaturedLinksSection.value,
}))
const featuredNewsItems = computed(() => {
  return (home.value?.data.featuredPress.items ?? []).map((article) => ({
    title: article.title,
    image: article.image,
    to: article.path,
    alt: article.alt || undefined,
    description: article.description || undefined,
    lang:
      article.titleLocale && article.titleLocale !== locale.value ? article.titleLocale : undefined,
    tags: article.tags,
    mediaOutletName: article.mediaOutlet?.name,
    mediaOutletLogo: article.mediaOutlet?.logo,
  }))
})
usePageSeo('meta.title', 'meta.description', {
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
  ],
})
</script>

<template>
  <div>
    <h1 class="sr-only">{{ t('meta.title') }}</h1>

    <HomeCarousel
      :items="carouselItems"
      :pending="homePending"
      :error="hasHomeError"
      @retry="refreshHome()"
    />

    <section :class="newsAndEventsSectionClass" :aria-label="t('home.newsAndEventsLabel')">
      <UContainer>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
          <div class="md:col-span-2">
            <HomeFeaturedNews
              :items="featuredNewsItems"
              :pending="homePending"
              :error="homeError"
              inline
              @retry="refreshHome()"
            />
          </div>
          <div class="md:col-span-1">
            <HomePublicAgenda
              :events="events"
              :pending="eventsLoading"
              :error="eventsError"
              @retry="refreshEvents()"
            />
          </div>
        </div>
      </UContainer>
    </section>

    <HomeFeaturedLinks
      :items="links"
      :pending="homePending"
      :error="hasHomeError"
      @retry="refreshHome()"
    />
  </div>
</template>
