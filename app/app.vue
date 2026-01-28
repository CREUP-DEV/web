<script setup lang="ts">
/**
 * Root App Component
 * Sets up global head attributes, SEO meta, and wraps the app with UApp.
 */
import * as locales from '@nuxt/ui/locale'

const { locale, t } = useI18n()

const lang = computed(() => locales[locale.value].code)
const dir = computed(() => locales[locale.value].dir)

// SEO and Head configuration
useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  title: () => t('meta.title'),
  meta: [
    { name: 'description', content: () => t('meta.description') },
    { name: 'theme-color', content: '#792225' },
    { name: 'author', content: 'CREUP' },
  ],
  link: [
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
    { rel: 'canonical', href: 'https://www.creup.es' },
  ],
})

// Schema.org for Organization
useSchemaOrg([
  defineOrganization({
    name: 'CREUP - Coordinadora de Representantes de Estudiantes de Universidades Públicas',
    url: 'https://www.creup.es',
    logo: 'https://www.creup.es/favicon.svg',
    description: () => t('meta.description'),
    sameAs: [
      'https://www.instagram.com/CREUPCREUP',
      'https://x.com/CREUPCREUP',
      'https://www.linkedin.com/company/creup',
      'https://www.facebook.com/CREUPCREUP',
      'https://www.tiktok.com/@creupestudiantes',
      'https://telegram.me/CREUP',
    ],
  }),
  defineWebSite({
    name: 'CREUP',
    url: 'https://www.creup.es',
    description: () => t('meta.description'),
    inLanguage: ['es-ES', 'en-US'],
  }),
])
</script>

<template>
  <UApp :locale="locales[locale]">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
