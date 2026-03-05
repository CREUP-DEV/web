<script setup lang="ts">
/**
 * Statement detail page (/prensa/comunicados/[slug])
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
    back-to="/prensa/comunicados/"
    :back-label="t('press.statements.backToList')"
  />
</template>
