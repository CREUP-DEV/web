<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('policy.positions.title', 'policy.positions.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.policy.label'),
      path: localePath('/politica/posicionamientos'),
    },
    {
      name: t('nav.policy.positions'),
      path: localePath('/politica/posicionamientos'),
    },
  ],
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
