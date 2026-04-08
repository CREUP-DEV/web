<script setup lang="ts">
defineProps<{
  logoSrc: string | null
  imageAlt: string
  title: string
  subtitle?: string | null
  initials?: string | null
  communityLabel?: string | null
  ariaLabel: string
  animationStyle?: Record<string, string>
}>()

const emit = defineEmits<{
  (e: 'click'): void
  (e: 'logo-error', logoSrc: string): void
}>()
</script>

<template>
  <button
    type="button"
    class="motion-card-strong group bg-surface/50 hover:bg-surface rounded-2xl p-5 ring-1 ring-gray-200/50 sm:p-6 dark:ring-gray-800/50"
    :style="animationStyle"
    :aria-label="ariaLabel"
    @click="emit('click')"
  >
    <div class="flex items-start gap-4">
      <div
        class="ring-primary/20 group-hover:ring-primary/40 flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-2 transition-all dark:bg-gray-800"
      >
        <NuxtImg
          v-if="logoSrc"
          :src="logoSrc"
          :alt="imageAlt"
          class="size-full object-contain p-2"
          @error="emit('logo-error', logoSrc)"
        />
        <UIcon v-else name="i-tabler-building" class="text-muted size-10" />
      </div>

      <div class="min-w-0 flex-1">
        <h3 class="text-base leading-tight font-semibold sm:text-lg">{{ title }}</h3>
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
  </button>
</template>
