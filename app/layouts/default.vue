<script setup lang="ts">
/**
 * Default Layout
 * Provides the main page structure with header, main content, and footer.
 * Includes skip-to-content link for accessibility.
 */
const { t } = useI18n()
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <!-- Skip to main content link for accessibility -->
    <a
      href="#main-content"
      class="bg-primary text-primary-foreground sr-only z-50 rounded px-4 py-2 focus:not-sr-only focus:absolute focus:top-4 focus:left-4"
    >
      {{ t('accessibility.skipToMain') }}
    </a>

    <AppHeader />

    <UMain id="main-content" class="flex-1">
      <slot />
    </UMain>

    <AppFooter />

    <CookieConsent />
  </div>
</template>
