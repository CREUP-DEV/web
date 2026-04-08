<script setup lang="ts">
const { t } = useI18n()
const { data: pressDossierLink } = await usePressDossierLink()

// Inject locale-aware <link rel="alternate" hreflang="..."> and canonical
// tags on every public page so search engines can find the correct locale.
const head = useLocaleHead({ seo: true })
useHead(head)
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
