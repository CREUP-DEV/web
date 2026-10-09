<script setup lang="ts">
defineProps<{
  sections: ReadonlyArray<{ id: string; number: number; title: string }>
  liveUrl: string
  liveUrlLabel: string
}>()

const { t } = useI18n()
</script>

<template>
  <nav
    aria-labelledby="press-kit-contents-title"
    class="bg-elevated/40 ring-default rounded-2xl p-5 ring-1 sm:p-6 print:bg-transparent print:p-0 print:ring-0"
  >
    <h2
      id="press-kit-contents-title"
      class="print:border-primary text-lg font-semibold print:mb-6 print:border-b-2 print:pb-2 print:text-2xl"
    >
      {{ t('pressKit.toc.title') }}
    </h2>

    <ol class="mt-4 grid gap-x-8 gap-y-2 sm:grid-cols-2 print:grid-cols-1 print:gap-y-3">
      <li v-for="section in sections" :key="section.id">
        <a
          :href="`#${section.id}`"
          class="group hover:text-primary flex items-baseline gap-3 transition-colors print:text-lg"
        >
          <span class="text-primary w-6 shrink-0 text-right font-semibold tabular-nums">
            {{ section.number }}.
          </span>
          <span class="group-hover:underline">{{ section.title }}</span>
        </a>
      </li>
    </ol>

    <p class="print-only text-muted mt-10 text-sm leading-relaxed">
      {{ t('pressKit.toc.liveVersion') }}
      <a :href="liveUrl" class="text-primary underline">{{ liveUrlLabel }}</a>
    </p>
  </nav>
</template>
