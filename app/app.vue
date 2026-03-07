<script setup lang="ts">
/**
 * Root App component.
 * Sets global document attributes and wraps pages with UApp.
 */
import { en, es } from '@nuxt/ui/locale'
import { getBaseLanguage } from '../shared/utils/locale'

const { locale, t } = useI18n()
const { getLanguageTag } = useLocales()

const nuxtUiLocales = { en, es } as const
const currentUiLocale = computed(
  () =>
    nuxtUiLocales[getBaseLanguage(getLanguageTag(locale.value)) as keyof typeof nuxtUiLocales] ??
    nuxtUiLocales[getBaseLanguage(getLanguageTag()) as keyof typeof nuxtUiLocales] ??
    nuxtUiLocales.es
)

const lang = computed(() => getLanguageTag(locale.value))
const dir = computed(() => currentUiLocale.value.dir)

// Global document head configuration
useHead({
  htmlAttrs: {
    lang,
    dir,
  },
  meta: [
    { name: 'theme-color', content: '#792225' },
    { name: 'author', content: 'CREUP' },
  ],
  link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
})

useSchemaOrg([
  defineOrganization({
    '@id': 'https://www.creup.es/#organization',
    name: 'CREUP - Coordinadora de Representantes de Estudiantes de Universidades Públicas',
    url: 'https://www.creup.es',
    logo: 'https://www.creup.es/favicon.svg',
    description: () => t('nuxtSiteConfig.description'),
    sameAs: [
      'https://www.instagram.com/CREUPCREUP',
      'https://x.com/CREUPCREUP',
      'https://www.linkedin.com/company/creup',
      'https://www.facebook.com/CREUPCREUP',
      'https://www.tiktok.com/@creupestudiantes',
      'https://telegram.me/CREUP',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Press',
      email: 'prensa@creup.es',
    },
  }),
])
</script>

<template>
  <UApp :locale="currentUiLocale">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
