<script setup lang="ts">
import LegalEn from '~/components/legal/LegalEn.vue'
import LegalEs from '~/components/legal/LegalEs.vue'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => t('footer.legal'),
  description: () => t('meta.legal.description'),
  ogTitle: () => t('footer.legal'),
  ogDescription: () => t('meta.legal.ogDescription'),
})
</script>

<template>
  <UContainer class="py-12">
    <LegalEs v-if="locale === 'es'" :title="t('footer.legal')" />
    <LegalEn v-else :title="t('footer.legal')" />
  </UContainer>
</template>
