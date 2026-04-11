<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  brandTagline: { type: String, required: false, default: '' },
  colorMode: { type: String, required: false, default: 'light' },
  description: { type: String, required: false, default: '' },
  sectionLabel: { type: String, required: false, default: '' },
  statsEyebrow: { type: String, required: false, default: '' },
  statsHeadline: { type: String, required: false, default: '' },
  supportText: { type: String, required: false, default: '' },
  title: { type: String, required: false, default: 'CREUP' },
})

const isDark = computed(() => props.colorMode === 'dark')
const palette = computed(() =>
  isDark.value
    ? {
        accent: '245, 238, 230',
        accentSoft: '245, 238, 230, 0.14',
        accentStrong: '#f5eee6',
        background: '#1b1110',
        backgroundAlt: '#2a1614',
        border: '245, 238, 230, 0.16',
        text: '#f5eee6',
        textMuted: '245, 238, 230, 0.78',
      }
    : {
        accent: '121, 34, 37',
        accentSoft: '121, 34, 37, 0.12',
        accentStrong: '#792225',
        background: '#f5eee6',
        backgroundAlt: '#fbf7f2',
        border: '121, 34, 37, 0.16',
        text: '#1f1717',
        textMuted: '63, 47, 47, 0.82',
      }
)

const titleText = computed(() => props.title)
const descriptionText = computed(() => props.description)
</script>

<template>
  <div
    class="relative flex h-full w-full overflow-hidden p-12 lg:p-16"
    :style="{
      background: `linear-gradient(135deg, ${palette.background} 0%, ${palette.backgroundAlt} 100%)`,
      color: palette.text,
    }"
  >
    <div
      class="absolute inset-0"
      :style="{
        backgroundImage: `radial-gradient(circle at 18% 20%, rgba(${palette.accent}, 0.14) 0%, transparent 28%), radial-gradient(circle at 82% 18%, rgba(${palette.accent}, 0.12) 0%, transparent 26%), radial-gradient(circle at 85% 82%, rgba(${palette.accent}, 0.1) 0%, transparent 30%)`,
      }"
    />
    <div
      class="absolute inset-0"
      :style="{
        backgroundImage:
          'linear-gradient(to bottom, rgba(255, 255, 255, 0.04), transparent 22%, transparent 78%, rgba(0, 0, 0, 0.08))',
      }"
    />

    <div class="relative flex h-full w-full flex-col justify-between">
      <div class="flex items-center justify-between gap-8">
        <div class="flex items-center gap-4">
          <div
            class="relative flex size-18 shrink-0 items-center justify-center rounded-full"
            :style="{
              backgroundColor: isDark ? 'rgba(245, 238, 230, 0.06)' : 'rgba(121, 34, 37, 0.08)',
              boxShadow: `0 0 0 1px rgba(${palette.border})`,
            }"
          >
            <svg viewBox="0 0 810 810" class="size-12 lg:size-14" aria-hidden="true">
              <rect width="810" height="810" rx="405" :fill="palette.background" />
              <g fill="none" :stroke="palette.accentStrong" stroke-width="14.28">
                <circle cx="405.16" cy="270.16" r="135.16" />
                <circle cx="337.65" cy="405.15" r="135.15" />
                <circle cx="472.65" cy="405.15" r="135.15" />
              </g>
            </svg>
          </div>

          <div class="flex flex-col">
            <span class="text-[42px] leading-none font-extrabold tracking-[-0.06em] lg:text-[56px]">
              CREUP
            </span>
            <span
              class="max-w-[520px] text-[18px] leading-tight font-medium"
              :style="{ color: palette.textMuted }"
            >
              {{ props.brandTagline }}
            </span>
          </div>
        </div>

        <div
          class="hidden rounded-full px-4 py-2 text-[18px] font-semibold tracking-[0.22em] uppercase lg:block"
          :style="{
            backgroundColor: isDark ? 'rgba(245, 238, 230, 0.08)' : 'rgba(121, 34, 37, 0.08)',
            color: palette.accentStrong,
            boxShadow: `0 0 0 1px rgba(${palette.border})`,
          }"
        >
          CREUP
        </div>
      </div>

      <div class="grid flex-1 items-end gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div class="max-w-[760px]">
          <p
            class="mb-5 text-[18px] font-semibold tracking-[0.24em] uppercase"
            :style="{ color: palette.accentStrong }"
          >
            {{ props.sectionLabel }}
          </p>

          <h1
            class="m-0 text-[52px] leading-[0.98] font-extrabold tracking-[-0.06em] lg:text-[82px]"
            style="display: block; line-clamp: 3; text-wrap: balance"
          >
            {{ titleText }}
          </h1>

          <p
            v-if="descriptionText"
            class="mt-6 max-w-[720px] text-[24px] leading-snug font-medium lg:text-[32px]"
            :style="{ color: palette.textMuted }"
          >
            {{ descriptionText }}
          </p>
        </div>

        <div class="flex justify-end">
          <div
            class="w-full max-w-[360px] rounded-[32px] p-6 lg:p-8"
            :style="{
              backgroundColor: isDark ? 'rgba(245, 238, 230, 0.06)' : 'rgba(255, 255, 255, 0.55)',
              boxShadow: `0 0 0 1px rgba(${palette.border})`,
            }"
          >
            <p
              class="text-[16px] font-semibold tracking-[0.18em] uppercase"
              :style="{ color: palette.accentStrong }"
            >
              {{ props.statsEyebrow }}
            </p>
            <p class="mt-2 text-[28px] leading-tight font-bold tracking-[-0.04em]">
              {{ props.statsHeadline }}
            </p>
            <div
              class="mt-6 h-px w-full"
              :style="{
                backgroundColor: isDark ? 'rgba(245, 238, 230, 0.14)' : 'rgba(121, 34, 37, 0.14)',
              }"
            />
            <p class="mt-5 text-[18px] leading-relaxed" :style="{ color: palette.textMuted }">
              {{ props.supportText }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
