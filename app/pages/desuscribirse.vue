<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
const route = useRoute()

const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw.trim() : ''
})

const state = ref<'idle' | 'loading' | 'done' | 'error'>('idle')

useSeoMeta({
  title: t('unsubscribePage.seo.title'),
  description: t('unsubscribePage.seo.description'),
  robots: 'noindex, nofollow',
})

async function unsubscribe() {
  if (!token.value || state.value === 'loading') return

  state.value = 'loading'

  try {
    const result = await $fetch<{ success: boolean; redirectTo: string }>(
      '/api/newsletter-unsubscribe',
      {
        method: 'POST',
        body: { token: token.value },
      }
    )
    state.value = 'done'
    await navigateTo(localePath(result.redirectTo))
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
