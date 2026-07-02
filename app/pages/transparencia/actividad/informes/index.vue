<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const { data: monthsData } = await useAreaReportsMonths()
const mostRecentAnchorKey = computed(() => monthsData.value?.data.anchors[0]?.monthKey ?? null)

if (mostRecentAnchorKey.value) {
  await navigateTo(localePath(`/transparencia/actividad/informes/${mostRecentAnchorKey.value}`), {
    redirectCode: 302,
  })
}

usePageSeo('activity.reports.title', 'activity.description', {
  breadcrumbs: () => [
    { name: t('nav.home'), path: localePath('/') },
    { name: t('nav.transparency.label'), path: localePath('/transparencia/actividad') },
    { name: t('activity.title'), path: localePath('/transparencia/actividad') },
    {
      name: t('activity.reports.breadcrumb'),
      path: localePath('/transparencia/actividad/informes'),
    },
  ],
})
</script>

<template>
  <section class="py-8 sm:py-12" :aria-label="t('activity.reports.title')">
    <UContainer>
      <header class="mb-8">
        <h1 class="text-3xl font-bold sm:text-4xl">{{ t('activity.reports.title') }}</h1>
      </header>

      <UCard class="text-center">
        <div class="flex flex-col items-center gap-3 py-6">
          <UIcon name="i-tabler-file-off" class="text-muted size-10" />
          <p class="text-muted">{{ t('activity.reports.empty') }}</p>
          <UButton
            :to="localePath('/transparencia/actividad')"
            variant="outline"
            color="neutral"
            icon="i-tabler-arrow-left"
          >
            {{ t('activity.detail.back') }}
          </UButton>
        </div>
      </UCard>
    </UContainer>
  </section>
</template>
