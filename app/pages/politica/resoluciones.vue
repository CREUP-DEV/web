<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('policy.resolutions.title', 'policy.resolutions.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.policy.label'),
      path: localePath('/politica/resoluciones'),
    },
    {
      name: t('nav.policy.resolutions'),
      path: localePath('/politica/resoluciones'),
    },
  ],
})
</script>

<template>
  <PuPolicyDocumentList
    api-endpoint="/api/resolutions"
    title-key="policy.resolutions.title"
    description-key="policy.resolutions.description"
    error-key="policy.resolutions.loadError"
    empty-key="policy.resolutions.empty"
  />
</template>
