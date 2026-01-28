<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Locale } from 'vue-i18n'
import * as uiLocales from '@nuxt/ui/locale'

const { locale, locales, setLocale, t, setLocaleCookie } = useI18n()

const availableLocales = locales.value.map((loc) => uiLocales[loc.code])

const switchLocale = (newLocale: Locale) => {
  setLocale(newLocale)
  setLocaleCookie(newLocale)
}

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.home'),
    to: '/',
    active: route.path === '/',
  },
  {
    label: t('nav.about.label'),
    active: route.path.startsWith('/conocenos'),
    children: [
      {
        label: t('nav.about.whatIs'),
        to: '/conocenos/que-es',
      },
      {
        label: t('nav.about.members'),
        to: '/conocenos/miembros',
      },
      {
        label: t('nav.about.team'),
        to: '/conocenos/equipo',
      },
      {
        label: t('nav.about.structure'),
        to: '/conocenos/estructura',
      },
    ],
  },
  {
    label: t('nav.policy.label'),
    active: route.path.startsWith('/pu'),
    children: [
      {
        label: t('nav.policy.positions'),
        to: '/pu/posicionamientos/',
      },
      {
        label: t('nav.policy.resolutions'),
        to: '/pu/resoluciones/',
      },
      {
        label: t('nav.policy.reports'),
        to: '/pu/informes-ejecutivos/',
      },
    ],
  },
  {
    label: t('nav.press.label'),
    active: route.path.startsWith('/prensa'),
    children: [
      {
        label: t('nav.press.newsletter'),
        to: '/prensa/newsletter/',
      },
      {
        label: t('nav.press.pressContact'),
        to: '/prensa/contacto/',
      },
      {
        label: t('nav.press.pressReleases'),
        to: '/prensa/notas-prensa/',
      },
      {
        label: t('nav.press.statements'),
        to: '/prensa/comunicados/',
      },
      {
        label: t('nav.press.inMedia'),
        to: '/prensa/en-los-medios/',
      },
      {
        label: t('nav.press.pressKit'),
        to: '/prensa/dossier/',
      },
    ],
  },
  {
    label: t('nav.events.label'),
    active: route.path.startsWith('/eventos'),
    children: [
      {
        label: t('nav.events.generalAssemblies'),
        to: '/eventos/asambleas/',
      },
      {
        label: t('nav.events.trainingStages'),
        to: '/eventos/stages-formativos/',
      },
      {
        label: t('nav.events.meetingsCongresses'),
        to: '/eventos/encuentros-congresos/',
      },
    ],
  },
  {
    label: t('nav.transparency.label'),
    active: route.path.startsWith('/transparencia'),
    children: [
      {
        label: t('nav.transparency.agreements'),
        to: '/transparencia/convenios/',
      },
      {
        label: t('nav.transparency.regulations'),
        to: '/transparencia/normativa/',
      },
      {
        label: t('nav.transparency.financialReports'),
        to: '/transparencia/informes-economicos/',
      },
      {
        label: t('nav.transparency.publicAgenda'),
        to: '/transparencia/agenda-publica/',
      },
      {
        label: t('nav.transparency.corporateIdentity'),
        to: '/transparencia/mic/',
      },
    ],
  },
  {
    label: t('nav.contact'),
    to: '/contacto',
    active: route.path.startsWith('/contacto'),
  },
])
</script>

<template>
  <UHeader
    :ui="{
      center: 'lg:hidden! xl:flex!',
      toggle: 'lg:inline-flex! xl:hidden!',
    }"
  >
    <template #title>
      <UColorModeImage
        light="/img/creup-imagotipo.svg"
        dark="/img/creup-imagotipo-dark.svg"
        alt="CREUP"
        class="h-8 w-auto"
      />
    </template>

    <UNavigationMenu content-orientation="vertical" :items="items" />

    <template #body>
      <UNavigationMenu orientation="vertical" :items="items" />
    </template>

    <template #right>
      <UColorModeButton />

      <ULocaleSelect
        v-model="locale"
        :locales="availableLocales"
        @update:model-value="switchLocale($event as Locale)"
      />
    </template>
  </UHeader>
</template>
