<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router'

const props = defineProps<{
  logoLight: string | null
  logoDark: string | null
  imageAlt: string
  title: string
  subtitle?: string | null
  initials?: string | null
  communityLabel?: string | null
  detailsAriaLabel?: string
  animationStyle?: Record<string, string>
  to?: RouteLocationRaw
}>()

const colorMode = useColorMode()
const resolvedLogo = computed(() => {
  if (colorMode.value === 'dark') {
    return props.logoDark ?? props.logoLight ?? ''
  }

  return props.logoLight ?? props.logoDark ?? ''
})
const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <component
    :is="to ? 'NuxtLink' : 'button'"
    class="motion-card-strong group bg-surface/50 hover:bg-surface ring-default rounded-2xl p-5 ring-1 sm:p-6"
    :style="animationStyle"
    :aria-label="detailsAriaLabel"
    v-bind="to ? { to } : { type: 'button' }"
    @click="!to && emit('click')"
  >
    <div class="flex items-start gap-4">
      <div
        class="ring-primary/20 group-hover:ring-primary/40 bg-elevated flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-2 transition-all group-hover:shadow-sm"
      >
        <AdaptiveImage
          v-if="resolvedLogo"
          :key="resolvedLogo"
          :src="resolvedLogo"
          :alt="imageAlt"
          width="80"
          height="80"
          fit="inside"
          sizes="80px"
          class="block size-full object-contain object-center p-1.5"
          format="webp"
          loading="lazy"
          decoding="async"
        />
        <UIcon v-else name="i-tabler-building" class="text-muted size-10" />
      </div>

      <div class="min-w-0 flex-1">
        <p class="text-base leading-tight font-semibold sm:text-lg">{{ title }}</p>
        <p v-if="subtitle" class="text-muted mt-2 text-sm leading-snug">{{ subtitle }}</p>
        <div
          v-if="initials || communityLabel"
          class="mt-3 flex flex-wrap items-center justify-center gap-2"
        >
          <UBadge
            v-if="initials"
            size="sm"
            color="neutral"
            variant="soft"
            class="px-2 py-0.5 text-xs font-semibold"
          >
            {{ initials }}
          </UBadge>
          <UBadge
            v-if="communityLabel"
            size="sm"
            color="neutral"
            variant="outline"
            class="px-2 py-0.5 text-xs font-semibold"
          >
            {{ communityLabel }}
          </UBadge>
        </div>
      </div>

      <UIcon
        name="i-tabler-chevron-right"
        class="text-muted group-hover:text-primary mt-1 size-5 shrink-0 transition-colors"
      />
    </div>
  </component>
</template>
