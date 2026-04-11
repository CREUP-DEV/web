<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

usePageSeo('press.inMedia.title', 'press.inMedia.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('nav.press.label'),
      path: localePath('/prensa/en-los-medios'),
    },
    {
      name: t('nav.press.inMedia'),
      path: localePath('/prensa/en-los-medios'),
    },
  ],
})
</script>

<template>
  <PressArticleList
    type="media_appearance"
    :title="t('press.inMedia.title')"
    :description="t('press.inMedia.description')"
    :empty-message="t('press.inMedia.empty')"
    :error-message="t('press.inMedia.loadError')"
  />
</template>
