<script setup lang="ts">
/**
 * Informes Ejecutivos page
 * Displays CREUP's executive report documents approved by the General Assembly.
 */

const { t } = useI18n()

useSeoMeta({
  title: () => t('policy.reports.title'),
  description: () => t('policy.reports.description'),
  ogTitle: () => t('policy.reports.title'),
  ogDescription: () => t('policy.reports.description'),
})
</script>

<template>
  <PuPolicyDocumentList
    api-endpoint="/api/informes-ejecutivos"
    title-key="policy.reports.title"
    description-key="policy.reports.description"
    error-key="policy.reports.loadError"
    empty-key="policy.reports.empty"
  />
</template>
