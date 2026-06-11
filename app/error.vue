<script setup lang="ts">
import type { NuxtError } from '#app'

const { error } = defineProps<{
  error: NuxtError
}>()

const { locale, t } = useI18n({ useScope: 'global' })
const localePath = useLocalePath()
const { getLanguageTag } = useLocales()

const currentLocale = useNuxtUiLocale(locale)

const lang = computed(() => getLanguageTag(locale.value))
const dir = computed(() => currentLocale.value.dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
})

const status = computed(() => error.status ?? 500)
const statusTitle = computed(() => {
  if (status.value === 404) return t('error.notFound')
  if (status.value === 403) return t('error.forbidden')
  if (status.value === 500) return t('error.server')
  if (status.value === 503) return t('error.unavailable')
  return t('error.generic')
})
const statusMessage = computed(() => {
  if (status.value === 403) return t('error.forbiddenMessage')
  if (status.value === 500) return t('error.serverMessage')
  if (status.value === 503) return t('error.unavailableMessage')
  return t('error.message')
})
const seoTitle = computed(() => `${status.value} - CREUP`)

useSeoMeta({
  title: seoTitle,
  robots: 'noindex',
})

const route = useRoute()
const { data: pressDossierLink } = await usePressDossierLink()

watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      await clearError()
    }
  }
)

const handleError = async () => {
  await clearError({ redirect: localePath('/') })
}

const handleNavigationClick = async (event: MouseEvent) => {
  const target = event.target instanceof Element ? event.target.closest('a[href]') : null
  if (!(target instanceof HTMLAnchorElement)) {
    return
  }

  if (
    target.target === '_blank' ||
    target.hasAttribute('download') ||
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  ) {
    return
  }

  const href = target.getAttribute('href')
  if (!href || href.startsWith('#')) {
    return
  }

  const resolvedUrl = new URL(href, window.location.origin)
  if (resolvedUrl.origin !== window.location.origin) {
    return
  }

  event.preventDefault()
  await clearError({
    redirect: `${resolvedUrl.pathname}${resolvedUrl.search}${resolvedUrl.hash}`,
  })
}
</script>

<template>
  <UApp :locale="currentLocale">
    <div class="bg-background flex min-h-screen flex-col" @click.capture="handleNavigationClick">
      <AppHeader :press-dossier-link="pressDossierLink" />

      <UMain class="flex-1">
        <UContainer class="flex items-center justify-center px-4 py-16">
          <UCard class="w-full max-w-xl text-center" :ui="{ body: 'py-10 sm:py-12' }">
            <p aria-hidden="true" class="text-primary text-7xl font-bold sm:text-8xl">
              {{ status }}
            </p>
            <h1 class="text-foreground mt-4 text-2xl font-semibold">
              {{ statusTitle }}
            </h1>
            <p class="text-muted mt-3 text-base">
              {{ statusMessage }}
            </p>
            <div class="mt-8 flex justify-center">
              <UButton size="lg" @click="handleError">
                {{ t('error.backHome') }}
              </UButton>
            </div>
          </UCard>
        </UContainer>
      </UMain>

      <AppFooter />
    </div>
  </UApp>
</template>
