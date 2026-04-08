<script setup lang="ts">
import type { OgImageComponents } from '#og-image/components'
import { useHomeData } from '@/composables/useHomeData'
import { useGoogleCalendar } from '@/composables/useGoogleCalendar'
import { usePress, type PressArticle, type PressArticleType } from '@/composables/usePress'

const { t } = useI18n()
const localePath = useLocalePath()

const { data: homeData, pending: homeDataPending } = useHomeData()
const { events, pending: eventsLoading, error: eventsError } = useGoogleCalendar()
const { data: featuredPressData } = usePress(null, undefined, 4)

const carouselItems = computed(() => homeData.value?.carousel ?? [])
const links = computed(() => homeData.value?.featuredLinks ?? [])
const featuredNewsItems = computed(() => {
  const typeUrlPrefix: Record<PressArticleType, string> = {
    press_release: '/prensa/notas-prensa',
    statement: '/prensa/comunicados',
    media_appearance: '/prensa/en-los-medios',
  }

  return (featuredPressData.value?.articles ?? []).map((article: PressArticle) => ({
    title: article.title,
    image: article.image,
    to: localePath(`${typeUrlPrefix[article.type]}/${article.slug}`),
    alt: article.alt || undefined,
    description: article.description || undefined,
    mediaOutletName: article.mediaOutlet?.name,
    mediaOutletLogo: article.mediaOutlet?.logo,
  }))
})

const homeOgImageComponent = 'NuxtSeo' as keyof OgImageComponents

defineOgImage(homeOgImageComponent, {
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
            <HomeFeaturedNews :items="featuredNewsItems" inline />
          </div>
          <div class="md:col-span-1">
            <HomePublicAgenda :events="events" :pending="eventsLoading" :error="eventsError" />
          </div>
        </div>
      </UContainer>
    </section>

    <HomeFeaturedLinks :items="links" :pending="homeDataPending" />
  </div>
</template>
