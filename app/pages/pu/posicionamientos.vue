<script setup lang="ts">
/**
 * Posicionamientos page
 * Displays CREUP's policy position documents approved by the General Assembly.
 */

const { t } = useI18n()

useSeoMeta({
  title: () => t('policy.positions.title'),
  description: () => t('policy.positions.description'),
  ogTitle: () => t('policy.positions.title'),
  ogDescription: () => t('policy.positions.description'),
})
</script>

<template>
  <PuPolicyDocumentList
    api-endpoint="/api/posicionamientos"
    title-key="policy.positions.title"
    description-key="policy.positions.description"
    error-key="policy.positions.loadError"
    empty-key="policy.positions.empty"
  />
</template>
