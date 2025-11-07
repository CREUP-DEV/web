<script setup lang="ts">
import { computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import type { MockDataCarouselItem } from '@/composables/useMockData'

const props = defineProps<{ items: MockDataCarouselItem[] }>()

const { width } = useWindowSize()

const images = computed(() => props.items.map((i) => i.image))
const getEntry = (img: string): MockDataCarouselItem | undefined =>
  props.items.find((i) => i.image === img)
</script>

<template>
  <div class="mb-10">
    <USkeleton v-if="!images.length" class="mx-auto mt-5 h-80 w-full max-w-6xl" />

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
        <NuxtImg
          :src="String(item)"
          class="mx-auto h-auto max-h-82 w-full rounded-lg object-contain"
        />
      </OverlayCaption>
    </UCarousel>
  </div>
</template>
