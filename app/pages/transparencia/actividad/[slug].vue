<script setup lang="ts">
import type { ActivityDetail } from '@/composables/activity/useActivity'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : route.params.slug
if (!slug) throw createError({ statusCode: 404 })

const { data, error } = await useActivityEntry(slug)

if (error.value || !data.value?.data) {
  throw createError({ statusCode: 404, message: t('activity.emptyList') })
}

const entry = computed<ActivityDetail>(() => data.value!.data as ActivityDetail)

const breadcrumbLabel = computed(() =>
  entry.value.kind === 'member'
    ? t('activity.detail.breadcrumbMember')
    : t('activity.detail.breadcrumbCreup')
)

useLocalizedPressDetailSeo({
  path: `/transparencia/actividad/${slug}`,
  translatedLocales: computed(() => entry.value.translatedLocales ?? null),
})

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonForHtmlScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.transparency.label') },
          { '@type': 'ListItem', position: 2, name: breadcrumbLabel.value },
          { '@type': 'ListItem', position: 3, name: entry.value.title },
        ],
      }),
    },
  ],
}))
</script>

<template>
  <ActivityDetail
    :entry="entry"
    :back-to="localePath('/transparencia/actividad')"
    :back-label="t('activity.detail.back')"
  />
</template>
