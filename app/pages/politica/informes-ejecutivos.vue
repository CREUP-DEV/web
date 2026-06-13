<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('policy.reports.title', 'policy.reports.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.policy.label'),
      path: localePath('/politica/informes-ejecutivos'),
    },
    {
      name: t('nav.policy.reports'),
      path: localePath('/politica/informes-ejecutivos'),
    },
  ],
})
</script>

<template>
  <PuPolicyDocumentList
    api-endpoint="/api/executive-reports"
    title-key="policy.reports.title"
    description-key="policy.reports.description"
    error-key="policy.reports.loadError"
    empty-key="policy.reports.empty"
  />
</template>
