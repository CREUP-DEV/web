import type { NavigationMenuItem } from '@nuxt/ui'
import type { MaybeRef } from 'vue'
import type { Locale } from 'vue-i18n'

import { useAuth } from '@/composables/useAuth'

type LocaleItem = {
  value: Locale
  label: string
  icon: string
}

type MobileNavLink = {
  active?: boolean
  external?: boolean
  icon: string
  label: string
  rel?: string
  target?: string
  to: string
}

type MobileNavSection = {
  active: boolean
  icon: string
  label: string
  links: MobileNavLink[]
  value: string
}

const createExternalNavigationItem = (label: string, href: string): NavigationMenuItem => ({
  label,
  to: href,
  external: true,
  target: '_blank',
  rel: 'noopener noreferrer',
})

export function usePublicHeaderNavigation(pressDossierLink?: MaybeRef<string | null | undefined>) {
  const { locale, t, setLocaleCookie } = useI18n()
  const { getLocaleName, localeConfigs } = useLocales()
  const { session } = useAuth()
  const localePath = useLocalePath()
  const switchLocalePath = useSwitchLocalePath()
  const route = useRoute()

  const resolvedPressDossierLink = computed(() => unref(pressDossierLink))

  const localeItems = computed<LocaleItem[]>(() =>
    localeConfigs.value.map((config) => ({
      value: config.code as Locale,
      label: getLocaleName(config.code),
      icon: config.flag,
    }))
  )

  const switchToLocale = (newLocale: string) => {
    if (!newLocale || newLocale === locale.value) {
      return
    }

    setLocaleCookie(newLocale as Locale)

    const targetPath = switchLocalePath(newLocale as Locale)
    if (!targetPath || targetPath === route.fullPath) {
      return
    }

    void navigateTo(targetPath)
  }

  const selectedLocale = computed({
    get: () => locale.value,
    set: (newLocale: string) => {
      switchToLocale(newLocale)
    },
  })

  const currentLocale = computed(() => {
    return (
      localeItems.value.find((item: LocaleItem) => item.value === locale.value) ??
      localeItems.value[0]
    )
  })

  const getLocaleIcon = (value?: Locale | string) =>
    localeItems.value.find((item: LocaleItem) => item.value === value)?.icon ?? ''

  const mobileLocaleItems = computed(() =>
    localeItems.value.map((item: LocaleItem) => ({
      label: item.label,
      icon: item.icon,
      onSelect: () => {
        switchToLocale(item.value)
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
          label: t('nav.press.news'),
          to: localizedPath('/prensa/noticias/'),
        },
        {
          label: t('nav.press.newsletter'),
          to: localizedPath('/prensa/newsletter/'),
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

  const mobilePrimaryLinks = computed<MobileNavLink[]>(() => [
    {
      label: t('nav.home'),
      to: localizedPath('/'),
      active: isSectionActive('/'),
      icon: 'i-tabler-home',
    },
  ])

  const mobileContactLink = computed<MobileNavLink>(() => ({
    label: t('nav.contact'),
    to: localizedPath('/contacto'),
    active: isSectionActive('/contacto'),
    icon: 'i-tabler-mail',
  }))

  const mobileSections = computed<MobileNavSection[]>(() => [
    {
      value: 'about',
      label: t('nav.about.label'),
      icon: 'i-tabler-users-group',
      active: isSectionActive('/conocenos'),
      links: [
        {
          label: t('nav.about.whatIs'),
          to: localizedPath('/conocenos/que-es'),
          icon: 'i-tabler-info-circle',
        },
        {
          label: t('nav.about.members'),
          to: localizedPath('/conocenos/miembros'),
          icon: 'i-tabler-building-community',
        },
        {
          label: t('nav.about.team'),
          to: localizedPath('/conocenos/equipo'),
          icon: 'i-tabler-user-heart',
        },
        {
          label: t('nav.about.committees'),
          to: localizedPath('/conocenos/comites'),
          icon: 'i-tabler-sitemap',
        },
        {
          label: t('nav.about.events'),
          to: localizedPath('/conocenos/eventos'),
          icon: 'i-tabler-calendar-event',
        },
      ],
    },
    {
      value: 'policy',
      label: t('nav.policy.label'),
      icon: 'i-tabler-scale',
      active: isSectionActive('/politica'),
      links: [
        {
          label: t('nav.policy.positions'),
          to: localizedPath('/politica/posicionamientos/'),
          icon: 'i-tabler-file-description',
        },
        {
          label: t('nav.policy.resolutions'),
          to: localizedPath('/politica/resoluciones/'),
          icon: 'i-tabler-writing-sign',
        },
        {
          label: t('nav.policy.reports'),
          to: localizedPath('/politica/informes-ejecutivos/'),
          icon: 'i-tabler-report-analytics',
        },
      ],
    },
    {
      value: 'press',
      label: t('nav.press.label'),
      icon: 'i-tabler-speakerphone',
      active: isSectionActive('/prensa'),
      links: [
        {
          label: t('nav.press.news'),
          to: localizedPath('/prensa/noticias/'),
          icon: 'i-tabler-news',
        },
        {
          label: t('nav.press.newsletter'),
          to: localizedPath('/prensa/newsletter/'),
          icon: 'i-tabler-mail',
        },
        ...(resolvedPressDossierLink.value
          ? [
              {
                ...createExternalNavigationItem(
                  t('nav.press.pressKit'),
                  resolvedPressDossierLink.value
                ),
                icon: 'i-tabler-file-type-pdf',
              } as MobileNavLink,
            ]
          : []),
      ],
    },
    {
      value: 'transparency',
      label: t('nav.transparency.label'),
      icon: 'i-tabler-building-bank',
      active: isSectionActive('/transparencia'),
      links: [
        {
          label: t('nav.transparency.regulations'),
          to: localizedPath('/transparencia/normativa/'),
          icon: 'i-tabler-book-2',
        },
        {
          label: t('nav.transparency.financialReports'),
          to: localizedPath('/transparencia/informes-economicos/'),
          icon: 'i-tabler-report-money',
        },
        {
          label: t('nav.transparency.corporateIdentity'),
          to: localizedPath('/transparencia/mic/'),
          icon: 'i-lucide-badge',
        },
        {
          label: t('nav.transparency.equality'),
          to: localizedPath('/transparencia/igualdad/'),
          icon: 'i-tabler-shield-heart',
        },
      ],
    },
  ])

  return {
    currentLocale,
    getLocaleIcon,
    isAdminUser,
    items,
    localeItems,
    mobileContactLink,
    mobileLocaleItems,
    mobilePrimaryLinks,
    mobileSections,
    selectedLocale,
    switchToLocale,
  }
}
