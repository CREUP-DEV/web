<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const cookiesPath = computed(() => `${localePath('/legal')}#cookies`)

const socials = useSocials()
</script>

<template>
  <UFooter>
    <template #left>
      <p class="text-muted w-full text-center text-sm lg:text-left">
        {{ t('footer.tagline') }} - {{ new Date().getFullYear() }}
      </p>
    </template>

    <div class="flex flex-wrap items-center justify-center gap-1">
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
    </div>

    <template #right>
      <nav
        class="flex w-full items-center justify-center gap-2 text-sm lg:justify-end"
        :aria-label="t('footer.legalNav')"
      >
        <NuxtLink
          :to="localePath('/legal')"
          class="text-muted hover:text-highlighted focus-visible:ring-primary/60 rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
        >
          {{ t('footer.legal') }}
        </NuxtLink>
        <span class="text-muted" aria-hidden="true">&middot;</span>
        <NuxtLink
          :to="cookiesPath"
          class="text-muted hover:text-highlighted focus-visible:ring-primary/60 cursor-pointer rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
        >
          {{ t('cookies.footerLink') }}
        </NuxtLink>
      </nav>
    </template>
  </UFooter>
</template>
