<script setup lang="ts">
/**
 * Press Releases listing page (/prensa/notas-prensa/)
 */
const { t } = useI18n()

useSeoMeta({
  title: () => t('press.releases.title'),
  description: () => t('press.releases.description'),
  ogTitle: () => t('press.releases.title'),
  ogDescription: () => t('press.releases.description'),
})
</script>

<template>
  <PressArticleList
    type="press_release"
    :title="t('press.releases.title')"
    :description="t('press.releases.description')"
    :empty-message="t('press.releases.empty')"
    :error-message="t('press.releases.loadError')"
  />
</template>
