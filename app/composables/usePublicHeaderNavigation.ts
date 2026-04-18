import type { NavigationMenuItem } from '@nuxt/ui'
import type { MaybeRef } from 'vue'
import type { Locale } from 'vue-i18n'

import { useAuth } from '@/composables/useAuth'

type LocaleItem = {
  value: Locale
  label: string
  icon: string
}

const createExternalNavigationItem = (label: string, href: string): NavigationMenuItem => ({
  label,
  to: href,
  external: true,
  target: '_blank',
  rel: 'noopener noreferrer',
})

export function usePublicHeaderNavigation(pressDossierLink?: MaybeRef<string | null | undefined>) {
  const { locale, setLocale, t, setLocaleCookie } = useI18n()
  const { defaultLocale, getLocaleName, localeConfigs } = useLocales()
  const { session } = useAuth()
  const localePath = useLocalePath()
  const route = useRoute()

  const resolvedPressDossierLink = computed(() => unref(pressDossierLink))

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
          label: t('nav.about.events'),
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
        ...(resolvedPressDossierLink.value
          ? [createExternalNavigationItem(t('nav.press.pressKit'), resolvedPressDossierLink.value)]
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

  return {
    currentLocale,
    getLocaleIcon,
    isAdminUser,
    items,
    localeItems,
    mobileLocaleItems,
    selectedLocale,
  }
}
