<script setup lang="ts">
const { t } = useI18n()

usePageSeo('press.releases.title', 'press.releases.description')
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
