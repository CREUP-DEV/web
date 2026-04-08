<script setup lang="ts">
import type { PressArticle } from '@/composables/usePress'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (!slug) throw createError({ statusCode: 404 })

const { data, error } = await usePressArticle(slug)

if (error.value || !data.value?.article) {
  throw createError({ statusCode: 404, message: t('press.notFound') })
}

const article = computed<PressArticle>(() => data.value!.article as PressArticle)
</script>

<template>
  <PressArticleDetail
    :article="article"
    :back-to="localePath('/prensa/en-los-medios/')"
    :back-label="t('press.inMedia.backToList')"
  />
</template>
