<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('press.releases.title', 'press.releases.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.press.label'),
      path: localePath('/prensa/notas-prensa'),
    },
    {
      name: t('nav.press.pressReleases'),
      path: localePath('/prensa/notas-prensa'),
    },
  ],
})
</script>

<template>
  <PressArticleList
    type="press_release"
    :title="t('press.releases.title')"
    :description="t('press.releases.description')"
    :empty-message="t('press.releases.empty')"
    :error-message="t('press.releases.loadError')"
  />
</template>
