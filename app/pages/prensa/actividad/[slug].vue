<script setup lang="ts">
import type { ActivityDetail } from '@/composables/activity/useActivity'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'
import { ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'

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

const canonicalRedirect = usePublicDetailCanonical({
  requestedPath: `${ACTIVITY_PUBLIC_BASE_PATH}/${slug}`,
  canonicalPath: () => `${ACTIVITY_PUBLIC_BASE_PATH}/${entry.value.slug}`,
  translatedLocales: () => entry.value.translatedLocales,
})
if (canonicalRedirect) await canonicalRedirect

useHead(() => ({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: serializeJsonForHtmlScript({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('nav.press.label') },
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
    :back-to="localePath('/prensa/actividad')"
    :back-label="t('activity.detail.back')"
  />
</template>
