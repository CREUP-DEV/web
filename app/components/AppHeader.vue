<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Locale } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

type LocaleConfig = {
  code: string
  flag: string
}

type LocaleItem = {
  value: Locale
  label: string
  icon: string
}

const { locale, setLocale, t, setLocaleCookie } = useI18n()
const { session } = useAuth()

const { localeConfigs } = useLocales()

const localeItems = computed<LocaleItem[]>(() =>
  (localeConfigs.value as LocaleConfig[]).map((config) => ({
    value: config.code as Locale,
    label: t(`language.locales.${config.code}`),
    icon: config.flag,
  }))
)

const selectedLocale = computed({
  get: () => locale.value,
  set: (newLocale: string) => {
    if (!newLocale) return
    setLocale(newLocale as Locale)
    setLocaleCookie(newLocale as Locale)
  },
})

const currentLocale = computed(
  () =>
    localeItems.value.find((item: LocaleItem) => item.value === locale.value) ??
    localeItems.value[0]
)

const getLocaleIcon = (value?: Locale | string) =>
  localeItems.value.find((item: LocaleItem) => item.value === value)?.icon ?? ''

const mobileLocaleItems = computed(() =>
  localeItems.value.map((item: LocaleItem) => ({
    label: item.label,
    icon: item.icon,
    onSelect: () => {
      selectedLocale.value = item.value
    },
  }))
)

// Check if user is logged in
const isLoggedIn = computed(() => !!session.value?.data?.user)

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
        alt="CREUP logo"
        class="h-8 w-auto"
      />
    </template>

    <UNavigationMenu
      content-orientation="vertical"
      :items="items"
      :aria-label="t('accessibility.mainNavigation')"
    />

    <template #body>
      <UNavigationMenu
        orientation="vertical"
        :items="items"
        :aria-label="t('accessibility.mobileNavigation')"
      />
    </template>

    <template #right>
      <!-- Admin panel button (only when logged in) -->
      <UTooltip v-if="isLoggedIn" :text="t('nav.admin')">
        <UButton
          to="/admin"
          icon="i-tabler-settings-2"
          color="neutral"
          variant="ghost"
          :aria-label="t('nav.admin')"
        />
      </UTooltip>

      <UTooltip :text="t('theme.toggle')">
        <UColorModeButton />
      </UTooltip>

      <!-- Desktop locale selector -->
      <USelect
        v-model="selectedLocale"
        :items="localeItems"
        value-key="value"
        class="hidden w-36 sm:block"
        :aria-label="t('language.toggle')"
      >
        <template #leading="{ modelValue }">
          <UIcon v-if="modelValue" :name="getLocaleIcon(modelValue)" class="size-5" />
        </template>
      </USelect>

      <!-- Mobile locale dropdown -->
      <UDropdownMenu :items="mobileLocaleItems" class="sm:hidden">
        <UButton
          :icon="currentLocale!.icon"
          color="neutral"
          variant="ghost"
          size="lg"
          :aria-label="t('language.toggle')"
        />
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
