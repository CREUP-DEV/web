<script setup lang="ts">
usePageSeo('policy.reports.title', 'policy.reports.description')
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
