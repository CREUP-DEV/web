<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { Locale } from 'vue-i18n'
import { useAuth } from '@/composables/useAuth'

type LocaleItem = {
  value: Locale
  label: string
  icon: string
}

interface PressDossierResponse {
  item: {
    pdfUrl: string
  } | null
}

const { locale, setLocale, t, setLocaleCookie } = useI18n()
const { defaultLocale, getLocaleName, localeConfigs } = useLocales()
const { session } = useAuth()
const localePath = useLocalePath()

const localeItems = computed<LocaleItem[]>(() =>
  localeConfigs.value.map((config) => ({
    value: config.code as Locale,
    label: getLocaleName(config.code),
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
    localeItems.value.find((item: LocaleItem) => item.value === defaultLocale) ??
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

const isAdminUser = computed(() => Boolean(session.value?.data?.user?.id))

const { data: pressDossierData } = await useFetch<PressDossierResponse>('/api/press-dossier')

const route = useRoute()
const pressDossierLink = computed(() => pressDossierData.value?.item?.pdfUrl ?? null)
const localizedPath = (path: string) => localePath(path)
const normalizePath = (path: string) => {
  let normalized = path.trim() || '/'

  if (normalized !== '/' && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  const matchedLocale = localeConfigs.value.find(
    (config) => normalized === `/${config.code}` || normalized.startsWith(`/${config.code}/`)
  )

  if (!matchedLocale) {
    return normalized || '/'
  }

  const strippedPath = normalized.slice(matchedLocale.code.length + 1) || '/'
  return strippedPath.startsWith('/') ? strippedPath : `/${strippedPath}`
}
const normalizedRoutePath = computed(() => normalizePath(route.path))
const isSectionActive = (sectionPath: string) => {
  const normalizedSectionPath = normalizePath(sectionPath)

  if (normalizedSectionPath === '/') {
    return normalizedRoutePath.value === '/'
  }

  return (
    normalizedRoutePath.value === normalizedSectionPath ||
    normalizedRoutePath.value.startsWith(`${normalizedSectionPath}/`)
  )
}

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('nav.home'),
    to: localizedPath('/'),
    active: isSectionActive('/'),
  },
  {
    label: t('nav.about.label'),
    to: localizedPath('/conocenos/que-es'),
    active: isSectionActive('/conocenos'),
    children: [
      {
        label: t('nav.about.whatIs'),
        to: localizedPath('/conocenos/que-es'),
      },
      {
        label: t('nav.about.members'),
        to: localizedPath('/conocenos/miembros'),
      },
      {
        label: t('nav.about.team'),
        to: localizedPath('/conocenos/equipo'),
      },
      {
        label: t('nav.about.committees'),
        to: localizedPath('/conocenos/comites'),
      },
      {
        label: t('nav.events.label'),
        to: localizedPath('/conocenos/eventos'),
      },
    ],
  },
  {
    label: t('nav.policy.label'),
    active: isSectionActive('/politica'),
    children: [
      {
        label: t('nav.policy.positions'),
        to: localizedPath('/politica/posicionamientos/'),
      },
      {
        label: t('nav.policy.resolutions'),
        to: localizedPath('/politica/resoluciones/'),
      },
      {
        label: t('nav.policy.reports'),
        to: localizedPath('/politica/informes-ejecutivos/'),
      },
    ],
  },
  {
    label: t('nav.press.label'),
    active: isSectionActive('/prensa'),
    children: [
      {
        label: t('nav.press.newsletter'),
        to: localizedPath('/prensa/newsletter/'),
      },
      {
        label: t('nav.press.pressReleases'),
        to: localizedPath('/prensa/notas-prensa/'),
      },
      {
        label: t('nav.press.statements'),
        to: localizedPath('/prensa/comunicados/'),
      },
      {
        label: t('nav.press.inMedia'),
        to: localizedPath('/prensa/en-los-medios/'),
      },
      ...(pressDossierLink.value
        ? [
            {
              label: t('nav.press.pressKit'),
              href: pressDossierLink.value,
              target: '_blank',
            },
          ]
        : []),
    ],
  },
  {
    label: t('nav.transparency.label'),
    active: isSectionActive('/transparencia'),
    children: [
      {
        label: t('nav.transparency.regulations'),
        to: localizedPath('/transparencia/normativa/'),
      },
      {
        label: t('nav.transparency.financialReports'),
        to: localizedPath('/transparencia/informes-economicos/'),
      },
      {
        label: t('nav.transparency.corporateIdentity'),
        to: localizedPath('/transparencia/mic/'),
      },
      {
        label: t('nav.transparency.equality'),
        to: localizedPath('/transparencia/igualdad/'),
      },
    ],
  },
  {
    label: t('nav.contact'),
    to: localizedPath('/contacto'),
    active: isSectionActive('/contacto'),
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
        light="/nav/creup-site-header-logo-light.svg"
        dark="/nav/creup-site-header-logo-dark.svg"
        :alt="t('accessibility.siteLogo')"
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
      <UTooltip v-if="isAdminUser" :text="t('nav.admin')">
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

      <UDropdownMenu :items="mobileLocaleItems" class="sm:hidden">
        <UButton
          :icon="currentLocale!.icon"
          color="neutral"
          variant="ghost"
          size="lg"
          :aria-label="t('language.openMenu')"
        />
      </UDropdownMenu>
    </template>
  </UHeader>
</template>
