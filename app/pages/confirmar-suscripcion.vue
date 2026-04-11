<script setup lang="ts">
const localePath = useLocalePath()
const { t } = useI18n()
const route = useRoute()
const token = computed(() => {
  const raw = route.query.token
  return typeof raw === 'string' ? raw.trim() : ''
})

type ConfirmState =
  | 'idle'
  | 'loading'
  | 'confirmed'
  | 'already-confirmed'
  | 'expired'
  | 'invalid'
  | 'error'

const state = ref<ConfirmState>('idle')

usePageSeo('confirmSubscription.seo.title', 'confirmSubscription.seo.description')
useSeoAlternateLinksOverride([])

useSeoMeta({ robots: 'noindex, nofollow' })

async function confirm() {
  if (!token.value || state.value === 'loading') return

  state.value = 'loading'

  try {
    const result = await $fetch<{ redirectTo: string; status: ConfirmState; success: boolean }>(
      '/api/newsletter-confirm',
      {
        method: 'POST',
        body: { token: token.value },
      }
    )

    state.value = result.status
    await navigateTo(localePath(result.redirectTo))
  } catch {
    state.value = 'error'
  }
}

onMounted(() => {
  if (!token.value) return

  void confirm()
})
</script>

<template>
  <UContainer class="flex min-h-[60vh] items-center justify-center py-16">
    <div class="mx-auto w-full max-w-md">
      <UCard class="text-center">
        <template v-if="!token">
          <UIcon name="i-tabler-alert-circle" class="text-error mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.invalidTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.invalidDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('confirmSubscription.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else-if="state === 'error'">
          <UIcon name="i-tabler-alert-circle" class="text-error mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.errorTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.errorDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('confirmSubscription.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else-if="state === 'already-confirmed'">
          <UIcon name="i-tabler-mail-check" class="text-success mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.alreadyConfirmedTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.alreadyConfirmedDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('confirmSubscription.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else-if="state === 'expired'">
          <UIcon name="i-tabler-mail-x" class="text-warning mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.expiredTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.expiredDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('confirmSubscription.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else-if="state === 'invalid'">
          <UIcon name="i-tabler-alert-circle" class="text-error mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.invalidTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.invalidDescription') }}
          </p>
          <UButton :to="localePath('/prensa/newsletter')" variant="outline">
            {{ t('confirmSubscription.backToNewsletter') }}
          </UButton>
        </template>
        <template v-else-if="state === 'confirmed'">
          <UIcon name="i-tabler-mail-check" class="text-success mx-auto mb-4 size-12" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.confirmedTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.confirmedDescription') }}
          </p>
        </template>
        <template v-else>
          <UIcon name="i-tabler-loader-2" class="text-primary mx-auto mb-4 size-12 animate-spin" />
          <h1 class="mb-2 text-xl font-bold">
            {{ t('confirmSubscription.processingTitle') }}
          </h1>
          <p class="text-muted mb-6">
            {{ t('confirmSubscription.processingDescription') }}
          </p>
        </template>
      </UCard>
    </div>
  </UContainer>
</template>
