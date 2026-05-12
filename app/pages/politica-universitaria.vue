<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

const policyLinks = computed(() => [
  {
    title: t('policy.positions.title'),
    description: t('policy.positions.description'),
    to: localePath('/politica/posicionamientos'),
    icon: 'i-tabler-file-description',
  },
  {
    title: t('policy.resolutions.title'),
    description: t('policy.resolutions.description'),
    to: localePath('/politica/resoluciones'),
    icon: 'i-tabler-writing-sign',
  },
  {
    title: t('policy.reports.title'),
    description: t('policy.reports.description'),
    to: localePath('/politica/informes-ejecutivos'),
    icon: 'i-tabler-report-analytics',
  },
])

usePageSeo('policy.landing.title', 'policy.landing.description', {
  webPageType: 'CollectionPage',
  breadcrumbs: () => [
    {
      name: t('nav.home'),
      path: localePath('/'),
    },
    {
      name: t('policy.landing.title'),
      path: localePath('/politica-universitaria'),
    },
  ],
})
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <article class="mx-auto max-w-5xl space-y-10">
      <header class="mx-auto max-w-3xl text-center">
        <p class="text-primary text-sm font-semibold tracking-wide uppercase">
          {{ t('nav.policy.label') }}
        </p>
        <h1 class="mt-3 text-3xl font-bold sm:text-4xl">
          {{ t('policy.landing.title') }}
        </h1>
        <p class="text-muted mt-4 text-lg">
          {{ t('policy.landing.description') }}
        </p>
      </header>

      <div class="grid gap-5 md:grid-cols-3">
        <NuxtLink
          v-for="item in policyLinks"
          :key="item.to"
          :to="item.to"
          class="group focus-visible:ring-primary block rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <UCard class="motion-card-subtle h-full">
            <div class="space-y-4">
              <div
                class="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full"
                aria-hidden="true"
              >
                <UIcon :name="item.icon" class="size-6" />
              </div>
              <div class="space-y-2">
                <h2 class="text-lg font-semibold group-hover:underline">
                  {{ item.title }}
                </h2>
                <p class="text-muted text-sm leading-relaxed">
                  {{ item.description }}
                </p>
              </div>
              <span class="text-primary inline-flex items-center gap-1 text-sm font-medium">
                {{ t('policy.landing.viewDocuments') }}
                <UIcon name="i-tabler-arrow-right" class="size-4" aria-hidden="true" />
              </span>
            </div>
          </UCard>
        </NuxtLink>
      </div>
    </article>
  </UContainer>
</template>
