<script setup lang="ts">
import LegalCa from '@/components/legal/LegalCa.vue'
import LegalEn from '@/components/legal/LegalEn.vue'
import LegalEs from '@/components/legal/LegalEs.vue'

const { t, locale } = useI18n()
const { defaultLocale } = useLocales()

const legalComponents = {
  ca: LegalCa,
  en: LegalEn,
  es: LegalEs,
} as const

const legalComponent = computed(
  () =>
    legalComponents[locale.value as keyof typeof legalComponents] ??
    legalComponents[defaultLocale as keyof typeof legalComponents] ??
    LegalEs
)

usePageSeo(
  () => t('footer.legal'),
  () => t('meta.legal.description')
)
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <component :is="legalComponent" :title="t('footer.legal')" />
  </UContainer>
</template>
