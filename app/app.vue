<script setup lang="ts">
import { en, es } from '@nuxt/ui/locale'
import { getBaseLanguage } from '~~/shared/utils/locale'

const { locale, t } = useI18n()
const { getLanguageTag } = useLocales()
const localeHead = useLocaleHead({ seo: true })
const siteConfig = useSiteConfig()
const siteUrl = computed(() => String(siteConfig.url ?? 'https://www.creup.es'))

const nuxtUiLocales = { en, es } as const
const currentUiLocale = computed(
  () =>
    nuxtUiLocales[getBaseLanguage(getLanguageTag(locale.value)) as keyof typeof nuxtUiLocales] ??
    nuxtUiLocales[getBaseLanguage(getLanguageTag()) as keyof typeof nuxtUiLocales] ??
    nuxtUiLocales.es
)

const lang = computed(() => getLanguageTag(locale.value))
const dir = computed(() => currentUiLocale.value.dir)
const pageTransition = import.meta.dev
  ? false
  : {
      name: 'page-shell',
      mode: 'out-in' as const,
    }

useHead(() => ({
  htmlAttrs: {
    lang: localeHead.value.htmlAttrs?.lang ?? lang.value,
    dir: (localeHead.value.htmlAttrs?.dir ?? dir.value) as 'auto' | 'ltr' | 'rtl',
  },
  meta: [
    ...(localeHead.value.meta ?? []),
    { name: 'theme-color', content: '#792225' },
    { name: 'author', content: 'CREUP' },
  ],
  link: [
    ...(localeHead.value.link ?? []).filter((link) => link.rel !== 'canonical'),
    { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg', sizes: 'any' },
    { rel: 'shortcut icon', type: 'image/x-icon', href: '/favicon.ico' },
  ],
}))

useSchemaOrg([
  defineWebSite({
    '@id': () => `${siteUrl.value}#website`,
    name: () => String(siteConfig.name ?? 'CREUP'),
    url: () => siteUrl.value,
    inLanguage: () => lang.value,
  }),
  defineOrganization({
    '@id': () => `${siteUrl.value}#organization`,
    name: 'CREUP - Coordinadora de Representantes de Estudiantes de Universidades Públicas',
    url: () => siteUrl.value,
    logo: () => `${siteUrl.value}/favicon.svg`,
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
      <NuxtPage :transition="pageTransition" />
    </NuxtLayout>
  </UApp>
</template>
