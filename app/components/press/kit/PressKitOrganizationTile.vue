<script setup lang="ts">
defineProps<{
  logo: string | null
  title: string
  subtitle?: string | null
  details?: string | null
  imageLoading: 'lazy' | 'eager'
}>()
</script>

<template>
  <div
    class="bg-default ring-default flex h-full items-center gap-3 rounded-xl p-3 ring-1 print:break-inside-avoid print:p-2"
  >
    <!-- Always the light logo on white, so it prints the same in either colour mode. -->
    <div
      class="ring-default flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 print:size-12"
    >
      <AdaptiveImage
        v-if="logo"
        :src="logo"
        alt=""
        width="112"
        height="112"
        fit="inside"
        format="webp"
        class="block size-full object-contain p-1"
        :loading="imageLoading"
        decoding="async"
      />
      <UIcon v-else name="i-tabler-building" class="size-7 text-neutral-400" aria-hidden="true" />
    </div>

    <div class="min-w-0">
      <p class="text-sm leading-snug font-semibold">{{ title }}</p>
      <p v-if="subtitle" class="text-muted mt-0.5 text-xs leading-snug">{{ subtitle }}</p>
      <p v-if="details" class="text-muted mt-1 text-xs font-medium">{{ details }}</p>
    </div>
  </div>
</template>
