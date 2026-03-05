<script setup lang="ts">
/**
 * Media appearances listing page (/prensa/en-los-medios/)
 */
const { t } = useI18n()

useSeoMeta({
  title: () => t('press.inMedia.title'),
  description: () => t('press.inMedia.description'),
  ogTitle: () => t('press.inMedia.title'),
  ogDescription: () => t('press.inMedia.description'),
})
</script>

<template>
  <PressArticleList
    type="media_appearance"
    :title="t('press.inMedia.title')"
    :description="t('press.inMedia.description')"
    :empty-message="t('press.inMedia.empty')"
    :error-message="t('press.inMedia.loadError')"
  />
</template>
