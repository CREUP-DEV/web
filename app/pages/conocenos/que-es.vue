<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => `${t('nav.about.whatIs')}`,
  description: () => t('common.comingSoon'),
  ogTitle: () => `${t('nav.about.whatIs')}`,
  ogDescription: () => t('common.comingSoon'),
})
</script>

<template>
  <UContainer class="py-12">
    <section class="mx-auto max-w-3xl text-center">
      <h1 class="text-3xl font-bold sm:text-4xl">{{ t('nav.about.whatIs') }}</h1>
      <p class="text-muted mt-4 text-lg">{{ t('common.comingSoon') }}</p>
    </section>
  </UContainer>
</template>
