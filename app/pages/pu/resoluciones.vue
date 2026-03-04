<script setup lang="ts">
/**
 * Resoluciones page
 * Displays CREUP's resolution documents approved by the General Assembly.
 */

const { t } = useI18n()

useSeoMeta({
  title: () => t('policy.resolutions.title'),
  description: () => t('policy.resolutions.description'),
  ogTitle: () => t('policy.resolutions.title'),
  ogDescription: () => t('policy.resolutions.description'),
})
</script>

<template>
  <PuPolicyDocumentList
    api-endpoint="/api/resoluciones"
    title-key="policy.resolutions.title"
    description-key="policy.resolutions.description"
    error-key="policy.resolutions.loadError"
    empty-key="policy.resolutions.empty"
  />
</template>
