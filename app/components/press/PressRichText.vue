<script setup lang="ts">
import { hasMeaningfulHtml } from '~~/shared/utils/richText'

const props = defineProps<{
  html?: string | null
}>()

const normalizedHtml = computed(() => {
  if (!hasMeaningfulHtml(props.html)) {
    return null
  }

  return props.html ?? null
})
</script>

<template>
  <!-- HTML is sanitized before persistence on the server. This wrapper keeps raw rendering out of page components. -->
  <!-- eslint-disable vue/no-v-html -->
  <div v-if="normalizedHtml" class="article-body press-rich-text" v-html="normalizedHtml" />
  <!-- eslint-enable vue/no-v-html -->
</template>
