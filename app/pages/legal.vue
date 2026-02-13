<script setup lang="ts">
import LegalEn from '~/components/legal/LegalEn.vue'
import LegalEs from '~/components/legal/LegalEs.vue'

const { t, locale } = useI18n()

useSeoMeta({
  title: () => `${t('footer.legal')}`,
  description: () =>
    locale.value === 'es'
      ? 'Aviso legal, condiciones generales, privacidad, cookies y política de enlaces de CREUP.'
      : 'Legal notice, terms of use, privacy, cookies and links policy of CREUP.',
  ogTitle: () => `${t('footer.legal')}`,
  ogDescription: () =>
    locale.value === 'es'
      ? 'Consulta el aviso legal y las condiciones generales de uso del sitio web de CREUP.'
      : 'Read the legal notice and general terms of use for the CREUP website.',
})
</script>

<template>
  <UContainer class="py-12">
    <LegalEs v-if="locale === 'es'" :title="t('footer.legal')" />
    <LegalEn v-else :title="t('footer.legal')" />
  </UContainer>
</template>
