<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { useMockData } from '@/composables/useMockData'
import type { MockDataItem } from '@/composables/useMockData'

const { width } = useWindowSize()

// Load test/mock data (client-only, lazy)
const { data: mock, pending } = useMockData()
const carousel = computed<MockDataItem[]>(() => mock.value?.carousel ?? [])
const images = computed(() => carousel.value.map((i) => i.image))
const getEntry = (img: string): MockDataItem | undefined =>
  carousel.value.find((i) => i.image === img)
</script>

<template>
  <USkeleton v-if="pending || !images.length" class="mx-auto mt-5 h-[320px] w-full max-w-6xl" />

  <UCarousel
    v-else
    v-slot="{ item }"
    :key="images.length"
    loop
    :arrows="width >= 1280"
    dots
    :autoplay="{ delay: 10000 }"
    :items="images"
    :ui="{ item: 'basis-1/1' }"
    class="mx-auto mt-5 w-full max-w-6xl"
  >
    <OverlayCaption
      :title="getEntry(String(item))?.title ?? ''"
      :href="getEntry(String(item))?.href"
      :link-text="getEntry(String(item))?.buttonText ?? ''"
    >
      <NuxtImg :src="String(item)" height="320" class="mx-auto max-h-[320px] rounded-lg" />
    </OverlayCaption>
  </UCarousel>
</template>
