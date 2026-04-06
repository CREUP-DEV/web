<script setup lang="ts">
usePageSeo('policy.resolutions.title', 'policy.resolutions.description')
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
