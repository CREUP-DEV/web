<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

const { t, locale } = useI18n();

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t("footer.legal"),
    to: "/aviso-legal-y-condiciones-generales",
  },
]);
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-sm text-center sm:text-left">
        {{ $t("footer.tagline") }} - {{ new Date().getFullYear() }}
      </p>
    </template>

    <UNavigationMenu :items="items" variant="link" />

    <template #right>
      <UButton
        icon="tabler-brand-instagram"
        color="neutral"
        variant="ghost"
        to="https://www.instagram.com/CREUPCREUP"
        target="_blank"
        :aria-label="$t('social.instagram')"
      />
      <UButton
        icon="tabler-brand-tiktok"
        color="neutral"
        variant="ghost"
        to="https://www.tiktok.com/@creupestudiantes"
        target="_blank"
        :aria-label="$t('social.tiktok')"
      />
      <UButton
        icon="tabler-brand-x"
        color="neutral"
        variant="ghost"
        to="https://x.com/CREUPCREUP"
        target="_blank"
        :aria-label="$t('social.x')"
      />
      <UButton
        icon="tabler-brand-linkedin"
        color="neutral"
        variant="ghost"
        to="https://www.linkedin.com/company/creup"
        target="_blank"
        :aria-label="$t('social.linkedin')"
      />
      <UButton
        icon="tabler-brand-facebook"
        color="neutral"
        variant="ghost"
        to="https://www.facebook.com/CREUPCREUP"
        target="_blank"
        :aria-label="$t('social.facebook')"
      />
      <UButton
        icon="tabler-brand-telegram"
        color="neutral"
        variant="ghost"
        to="https://telegram.me/CREUP"
        target="_blank"
        :aria-label="$t('social.telegram')"
      />
    </template>
  </UFooter>
</template>
