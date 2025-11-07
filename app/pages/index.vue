<script setup lang="ts">
import { useMockData } from '@/composables/useMockData'

const { data: mock } = useMockData()

const carouselItems = computed(() => mock.value?.carousel ?? [])
const news = computed(() => mock.value?.featuredNews ?? [])
const links = computed(() => mock.value?.featuredLinks ?? [])
</script>

<template>
  <div>
    <HomeCarousel :items="carouselItems" />
    <div class="grid lg:grid-cols-2">
      <HomeCreupBadge class="max-lg:mx-auto" />
      <HomeTagSelector class="my-auto" />
    </div>
    <!-- Pending skeletons could be added; for now components handle empty gracefully -->
    <HomeFeaturedNews :items="news" />
    <HomeFeaturedLinks :items="links" />
  </div>
</template>
