<script setup lang="ts">
import type { SeoAlternateLink } from '@/composables/useSeoAlternateLinksOverride'
import {
  createOrganizationStructuredData,
  useStructuredData,
} from '@/composables/useStructuredData'

const { t } = useI18n()
const siteConfig = useSiteConfig()
const siteUrl = useRuntimeSiteUrl()
const { data: pressDossierLink } = await usePressDossierLink()
const alternateLinksOverride = useState<SeoAlternateLink[] | null>(
  'seo-alternate-links-override',
  () => null
)

// Inject locale-aware <link rel="alternate" hreflang="..."> and canonical
// tags on every public page so search engines can find the correct locale.
const head = useLocaleHead({ seo: true })

const isLocaleAlternateLink = (link: { rel?: string; id?: string }) => {
  if (link.rel !== 'alternate') {
    return false
  }

  return link.id === 'i18n-xd' || link.id?.startsWith('i18n-alt-') === true
}

useStructuredData(
  computed(() => [
    createOrganizationStructuredData({
      name: String(siteConfig.name ?? '').trim(),
      url: siteUrl.value || null,
    }),
  ])
)

const mapRuntimeHeadUrls = (links: NonNullable<NonNullable<typeof head.value.link>>) =>
  links.map((link) => {
    if (!['alternate', 'canonical'].includes(link.rel || '') || typeof link.href !== 'string') {
      return link
    }

    try {
      const parsedUrl = new URL(link.href, siteUrl.value)
      const runtimeHref = new URL(
        `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`,
        siteUrl.value
      ).toString()
      return {
        ...link,
        href: runtimeHref,
      }
    } catch {
      return link
    }
  })

useHead(() => {
  const resolvedHead = head.value
  const runtimeLinks = mapRuntimeHeadUrls(resolvedHead.link ?? [])

  if (alternateLinksOverride.value === null) {
    return {
      ...resolvedHead,
      link: runtimeLinks,
    }
  }

  const nonAlternateLinks = runtimeLinks.filter((link) => !isLocaleAlternateLink(link))

  return {
    ...resolvedHead,
    link: [...nonAlternateLinks, ...alternateLinksOverride.value] as typeof resolvedHead.link,
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <a
      href="#main-navigation"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
    >
      {{ t('accessibility.skipToNavigation') }}
    </a>
    <a
      href="#main-content"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-20"
    >
      {{ t('accessibility.skipToMain') }}
    </a>

    <AppHeader :press-dossier-link="pressDossierLink" />

    <UMain id="main-content" class="flex-1">
      <slot />
    </UMain>

    <AppFooter />

    <CookieConsent />
  </div>
</template>
