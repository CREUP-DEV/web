<script setup lang="ts">
import type { PressArticle } from '@/composables/usePress'

const { t } = useI18n()
const route = useRoute()
const slug = route.params.slug as string

const { data, error } = await usePressArticle(slug)

if (error.value || !data.value?.article) {
  throw createError({ statusCode: 404, message: t('press.notFound') })
}

const article = computed<PressArticle>(() => data.value!.article as PressArticle)
</script>

<template>
  <PressArticleDetail
    :article="article"
    back-to="/prensa/notas-prensa/"
    :back-label="t('press.releases.backToList')"
  />
</template>
