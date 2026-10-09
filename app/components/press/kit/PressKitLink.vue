<script setup lang="ts">
// A button on screen; on paper, where nothing can be clicked, its label with the address spelled out.
const props = withDefaults(
  defineProps<{
    /** A localized site path or an absolute URL. */
    to: string
    label: string
    icon: string
    siteUrl: string
    color?: 'primary' | 'neutral'
  }>(),
  {
    color: 'primary',
  }
)

const absoluteUrl = computed(() =>
  props.to.startsWith('/') ? `${props.siteUrl}${props.to}` : props.to
)
const displayUrl = computed(() => absoluteUrl.value.replace(/^https?:\/\//, ''))
</script>

<template>
  <UButton class="no-print" :to="to" :icon="icon" :color="color" variant="soft" :label="label" />
  <p class="print-only text-sm">
    <span class="font-medium">{{ label }}:</span>
    {{ ' ' }}
    <a :href="absoluteUrl" class="text-primary">{{ displayUrl }}</a>
  </p>
</template>
