<script setup lang="ts">
import type { PressArticle } from '@/composables/press/usePress'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'

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

const canonicalRedirect = usePublicDetailCanonical({
  requestedPath: `${getPressArticlePublicListPath('press_release')}/${slug}`,
  canonicalPath: () => `${getPressArticlePublicListPath(article.value.type)}/${article.value.slug}`,
  translatedLocales: () => article.value.translatedLocales,
})
if (canonicalRedirect) await canonicalRedirect
</script>

<template>
  <PressArticleDetail
    :article="article"
    :back-to="localePath('/prensa/noticias')"
    :back-label="t('press.news.backToList')"
  />
</template>
