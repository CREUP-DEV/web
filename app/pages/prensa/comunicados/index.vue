<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('press.statements.title', 'press.statements.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.press.label'),
      path: localePath('/prensa/comunicados'),
    },
    {
      name: t('nav.press.statements'),
      path: localePath('/prensa/comunicados'),
    },
  ],
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
