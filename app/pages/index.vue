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
} = useHomeData()
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
} = usePress(null, undefined, 4)

const carouselItems = computed(() => homeData.value?.carousel ?? [])
const links = computed(() => homeData.value?.featuredLinks ?? [])
const hasHomeDataContent = computed(() => carouselItems.value.length > 0 || links.value.length > 0)
const hasCarouselSection = computed(
  () => homeDataPending.value || !!homeDataError.value || carouselItems.value.length > 0
)
const hasFeaturedLinksSection = computed(() => homeDataPending.value || links.value.length > 0)
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
const featuredPressItemCount = computed(() => featuredPressData.value?.items?.length ?? 0)
const hasRetriedEmptyHomeData = ref(false)
const hasRetriedEmptyFeaturedPress = ref(false)

if (import.meta.client) {
  watch(
    [homeDataPending, homeDataError, hasHomeDataContent],
    async ([pending, error, hasContent]) => {
      if (hasRetriedEmptyHomeData.value || pending || error || hasContent) {
        return
      }

      hasRetriedEmptyHomeData.value = true
      await refreshHomeData()
    },
    { immediate: true }
  )

  watch(
    [featuredPressPending, featuredPressError, featuredPressItemCount],
    async ([pending, error, itemCount]) => {
      if (hasRetriedEmptyFeaturedPress.value || pending || error || itemCount > 0) {
        return
      }

      hasRetriedEmptyFeaturedPress.value = true
      await refreshFeaturedPress()
    },
    { immediate: true }
  )
}

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
      :error="homeDataError"
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

    <HomeFeaturedLinks :items="links" :pending="homeDataPending" />
  </div>
</template>
