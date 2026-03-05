<script setup lang="ts">
/**
 * Media appearance detail page (/prensa/en-los-medios/[slug])
 */
const { t } = useI18n()
const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await usePressArticle(slug)

if (error.value || !data.value?.article) {
  throw createError({ statusCode: 404, message: t('press.notFound') })
}

const article = computed(() => data.value!.article)
</script>

<template>
  <PressArticleDetail
    :article="article"
    back-to="/prensa/en-los-medios/"
    :back-label="t('press.inMedia.backToList')"
  />
</template>
