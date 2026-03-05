<script setup lang="ts">
/**
 * Statements listing page (/prensa/comunicados/)
 */
const { t } = useI18n()

useSeoMeta({
  title: () => t('press.statements.title'),
  description: () => t('press.statements.description'),
  ogTitle: () => t('press.statements.title'),
  ogDescription: () => t('press.statements.description'),
})
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
