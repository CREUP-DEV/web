<script setup lang="ts">
const { t } = useI18n()

usePageSeo('press.inMedia.title', 'press.inMedia.description')
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
