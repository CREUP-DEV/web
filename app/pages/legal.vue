<script setup lang="ts">
import Legal from '@/components/legal/Legal.vue'

const { t } = useI18n()

usePageSeo(
  () => t('footer.legal'),
  () => t('meta.legal.description')
)
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <Legal :title="t('footer.legal')" />
  </UContainer>
</template>
