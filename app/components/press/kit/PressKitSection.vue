<script setup lang="ts">
defineProps<{
  id: string
  number: number
  title: string
}>()
</script>

<template>
  <section :id="id" :aria-labelledby="`${id}-title`" class="scroll-mt-24 print:break-before-page">
    <h2
      :id="`${id}-title`"
      class="border-primary mb-6 flex items-baseline gap-3 border-b-2 pb-2 text-2xl font-semibold print:mb-5"
    >
      <span class="text-primary tabular-nums">{{ number }}.</span>
      <span>{{ title }}</span>
    </h2>

    <slot />
  </section>
</template>
