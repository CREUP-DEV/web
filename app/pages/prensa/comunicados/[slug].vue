<script setup lang="ts">
import type { PressArticle } from '@/composables/press/usePress'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (!slug) throw createError({ statusCode: 404 })

const { data, error } = await usePressArticle(slug)

if (error.value || !data.value?.data) {
  throw createError({ statusCode: 404, message: t('press.notFound') })
}

const article = computed<PressArticle>(() => data.value!.data as PressArticle)

useLocalizedPressDetailSeo({
  path: `/prensa/comunicados/${slug}`,
  translatedLocales: computed(() => article.value.translatedLocales ?? null),
})
</script>

<template>
  <PressArticleDetail
    :article="article"
    :back-to="localePath('/prensa/noticias')"
    :back-label="t('press.news.backToList')"
  />
</template>
