<script setup lang="ts">
/**
 * Press Release detail page (/prensa/notas-prensa/[slug])
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
    back-to="/prensa/notas-prensa/"
    :back-label="t('press.releases.backToList')"
  />
</template>
