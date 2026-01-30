<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const { t } = useI18n()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: t('footer.legal'),
    to: '/aviso-legal-y-condiciones-generales',
  },
])

const socials = useSocials()
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted text-center text-sm sm:text-left">
        {{ t('footer.tagline') }} - {{ new Date().getFullYear() }}
      </p>
    </template>

    <UNavigationMenu :items="items" variant="link" />

    <template #right>
      <UTooltip v-for="social in socials" :key="social.label" :text="social.label">
        <UButton
          :icon="social.icon"
          color="neutral"
          variant="ghost"
          :to="social.to"
          target="_blank"
          :aria-label="social.label"
        />
      </UTooltip>
    </template>
  </UFooter>
</template>
