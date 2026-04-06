<script setup lang="ts">
const { t } = useI18n()

usePageSeo('press.statements.title', 'press.statements.description')
</script>

<template>
  <PressArticleList
    type="statement"
    :title="t('press.statements.title')"
    :description="t('press.statements.description')"
    :empty-message="t('press.statements.empty')"
    :error-message="t('press.statements.loadError')"
  />
</template>
