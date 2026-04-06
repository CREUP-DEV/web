<script setup lang="ts">
usePageSeo('policy.positions.title', 'policy.positions.description')
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
