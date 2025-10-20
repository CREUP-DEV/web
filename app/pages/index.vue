<script setup lang="ts">
import { computed } from "vue";
import { useWindowSize } from "@vueuse/core";
import { useMockData, useI18nField } from "@/composables/useMockData";

const { width } = useWindowSize();

// Load test/mock data
const mock = useMockData();
const carousel = computed(() => mock.value.carousel);
const images = computed(() => carousel.value.map((i) => i.image));
const getEntry = (img: string) => carousel.value.find((i) => i.image === img);
</script>

<template>
  <UCarousel
    v-slot="{ item }"
    loop
    :arrows="width >= 1280"
    dots
    :autoplay="{ delay: 10000 }"
    :items="images"
    :ui="{ item: 'basis-1/1' }"
    class="mt-5 w-full max-w-6xl mx-auto"
  >
    <OverlayCaption
      :title="useI18nField(getEntry(String(item))?.title).value"
      :href="getEntry(String(item))?.href"
      :linkText="useI18nField(getEntry(String(item))?.buttonText).value"
    >
      <NuxtImg
        :src="String(item)"
        height="320"
        class="mx-auto rounded-lg max-h-[320px]"
    /></OverlayCaption>
  </UCarousel>
</template>
