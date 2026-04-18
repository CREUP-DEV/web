<script setup lang="ts">
import { useHomeData } from '@/composables/useHomeData'
import { useGoogleCalendar } from '@/composables/useGoogleCalendar'
import { usePress, type PressArticle } from '@/composables/usePress'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

const { t } = useI18n()
const localePath = useLocalePath()

const {
  data: homeData,
  pending: homeDataPending,
  error: homeDataError,
  refresh: refreshHomeData,
} = await useHomeData()
const {
  events,
  pending: eventsLoading,
  error: eventsError,
  refresh: refreshEvents,
} = useGoogleCalendar()
const {
  data: featuredPressData,
  pending: featuredPressPending,
  error: featuredPressError,
  refresh: refreshFeaturedPress,
} = await usePress(null, undefined, 4)

const carouselItems = computed(() => homeData.value?.carousel ?? [])
const links = computed(() => homeData.value?.featuredLinks ?? [])
const hasHomeDataError = computed(() => Boolean(homeDataError.value))
const hasCarouselSection = computed(
  () => homeDataPending.value || !!homeDataError.value || carouselItems.value.length > 0
)
const hasFeaturedLinksSection = computed(
  () => homeDataPending.value || !!homeDataError.value || links.value.length > 0
)
const newsAndEventsSectionClass = computed(() => ({
  'pt-8 sm:pt-10': !hasCarouselSection.value,
  'pb-8 sm:pb-10': !hasFeaturedLinksSection.value,
  'py-4 sm:py-0': hasCarouselSection.value && hasFeaturedLinksSection.value,
}))
const featuredNewsItems = computed(() => {
  return (featuredPressData.value?.items ?? []).map((article: PressArticle) => ({
    title: article.title,
    image: article.image,
    to: localePath(`${getPressArticlePublicListPath(article.type)}/${article.slug}`),
    alt: article.alt || undefined,
    description: article.description || undefined,
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
      :pending="homeDataPending"
      :error="hasHomeDataError"
      @retry="refreshHomeData()"
    />

    <section :class="newsAndEventsSectionClass" :aria-label="t('home.newsAndEventsLabel')">
      <UContainer>
        <div class="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-6 lg:gap-8">
          <div class="md:col-span-2">
            <HomeFeaturedNews
              :items="featuredNewsItems"
              :pending="featuredPressPending"
              :error="featuredPressError"
              inline
              @retry="refreshFeaturedPress()"
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
      :pending="homeDataPending"
      :error="hasHomeDataError"
      @retry="refreshHomeData()"
    />
  </div>
</template>
