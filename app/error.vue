<script setup lang="ts">
import type { NuxtError } from '#app'
import { en, es } from '@nuxt/ui/locale'

const { error } = defineProps<{
  error: NuxtError
}>()

const { locale, t } = useI18n({ useScope: 'global' })

const nuxtUiLocales = { es, en } as const
const currentLocale = computed(
  () => nuxtUiLocales[locale.value as keyof typeof nuxtUiLocales] ?? nuxtUiLocales.es
)

const lang = computed(() => currentLocale.value.code)
const dir = computed(() => currentLocale.value.dir)

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
})

const status = computed(() => error.status ?? 500)
const statusText = computed(() => error.statusText || error.message || t('error.message'))

const route = useRoute()

watch(
  () => route.fullPath,
  async (newPath, oldPath) => {
    if (newPath !== oldPath) {
      await clearError()
    }
  }
)

const handleError = async () => {
  await clearError({ redirect: '/' })
}
</script>

<template>
  <UApp :locale="currentLocale">
    <div class="bg-background flex min-h-screen flex-col">
      <AppHeader />

      <UMain class="flex-1">
        <UContainer class="flex items-center justify-center px-4 py-16">
          <UCard class="w-full max-w-xl text-center" :ui="{ body: 'py-10 sm:py-12' }">
            <p class="text-primary text-7xl font-bold sm:text-8xl">
              {{ status }}
            </p>
            <h1 class="text-foreground mt-4 text-2xl font-semibold">
              {{ status === 404 ? t('error.notFound') : t('error.generic') }}
            </h1>
            <p class="text-muted mt-3 text-base">
              {{ statusText }}
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
