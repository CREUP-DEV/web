<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const route = useRoute()

const readQueryParam = (key: string) => {
  const raw = route.query[key]
  return typeof raw === 'string' ? raw.trim() : ''
}

const token = computed(() => readQueryParam('token'))
/**
 * Campaign attribution, forwarded untouched. It never affects whether the unsubscribe succeeds —
 * the server only uses it to credit the campaign that prompted it.
 */
const campaignId = computed(() => readQueryParam('c'))
const attribution = computed(() => readQueryParam('a'))

const state = ref<'idle' | 'loading' | 'done' | 'error'>('idle')

usePageSeo('unsubscribePage.seo.title', 'unsubscribePage.seo.description')
useSeoAlternateLinksOverride([])

useSeoMeta({ robots: 'noindex, nofollow' })

async function unsubscribe() {
  if (!token.value || state.value === 'loading') return

  state.value = 'loading'

  try {
    const result = await $fetch<{ data: { success: boolean; redirectTo: string } }>(
      '/api/newsletter-unsubscribe',
      {
        method: 'POST',
        body: {
          token: token.value,
          ...(campaignId.value && attribution.value
            ? { c: campaignId.value, a: attribution.value }
            : {}),
        },
        headers: localeApiHeaders.value,
      }
    )
    state.value = 'done'
    await navigateTo(localePath(result.data.redirectTo))
  } catch {
    state.value = 'error'
  }
}

onMounted(() => {
  if (!token.value) return

  void unsubscribe()
})
</script>

<template>
  <UContainer class="flex min-h-[60vh] items-center justify-center py-16">
    <div class="mx-auto w-full max-w-md">
      <UCard class="text-center">
        <template v-if="!token">
          <UIcon name="i-tabler-alert-circle" class="text-error mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('unsubscribePage.invalidTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('unsubscribePage.invalidDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('unsubscribePage.backToNewsletter') }}
          </UButton>
        </template>

        <template v-else-if="state === 'error'">
          <UIcon name="i-tabler-alert-circle" class="text-error mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('unsubscribePage.errorTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('unsubscribePage.errorDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('unsubscribePage.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else>
          <UIcon name="i-tabler-loader-2" class="text-primary mx-auto mb-4 size-12 animate-spin" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('unsubscribePage.processingTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('unsubscribePage.processingDescription') }}
          </p>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
