<script setup lang="ts">
/**
 * CookieConsent Banner + Settings Modal
 * Displays a GDPR-compliant bottom banner on the first visit and a
 * settings modal where users can granularly control cookie categories.
 * Preferences can be edited at any time via the footer link.
 */
import type { CookieCategory } from '@/composables/useCookieConsent'

const { t } = useI18n()
const {
  hasConsented,
  isAnalyticsAccepted,
  acceptAll,
  acceptEssentialOnly,
  savePreferences,
  showSettings,
  closeSettings,
} = useCookieConsent()

// Local toggle state for the settings modal
const analyticsEnabled = ref(false)

// Sync toggle when modal opens
watch(showSettings, (open) => {
  if (open) {
    analyticsEnabled.value = isAnalyticsAccepted.value
  }
})

function handleSave() {
  const accepted: CookieCategory[] = []
  if (analyticsEnabled.value) accepted.push('analytics')
  savePreferences(accepted)
}
</script>

<template>
  <!-- Banner -->
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="!hasConsented"
      role="region"
      :aria-label="t('cookies.banner.title')"
      class="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <UCard class="mx-auto max-w-3xl" :ui="{ body: 'space-y-4' }">
        <!-- Header -->
        <div class="flex items-start gap-3">
          <UIcon name="i-tabler-cookie" class="text-primary mt-0.5 size-6 shrink-0" />
          <div class="flex-1 space-y-1">
            <p class="text-sm font-semibold">
              {{ t('cookies.banner.title') }}
            </p>
            <p class="text-muted text-sm">
              {{ t('cookies.banner.description') }}
            </p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NuxtLink
            to="/legal#cookies"
            class="text-primary inline-flex items-center text-sm font-medium hover:underline"
          >
            {{ t('cookies.banner.learnMore') }}
          </NuxtLink>

          <div class="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-row">
            <UButton
              variant="ghost"
              color="neutral"
              size="md"
              class="justify-center"
              @click="showSettings = true"
            >
              {{ t('cookies.banner.customize') }}
            </UButton>
            <UButton
              variant="outline"
              color="neutral"
              size="md"
              class="justify-center"
              @click="acceptEssentialOnly"
            >
              {{ t('cookies.banner.essentialOnly') }}
            </UButton>
            <UButton
              size="md"
              class="order-first col-span-2 justify-center sm:order-3 sm:col-span-1"
              @click="acceptAll"
            >
              {{ t('cookies.banner.acceptAll') }}
            </UButton>
          </div>
        </div>
      </UCard>
    </div>
  </Transition>

  <!-- Settings Modal -->
  <UModal
    v-model:open="showSettings"
    :title="t('cookies.settings.title')"
    :description="t('cookies.settings.description')"
  >
    <template #body>
      <div class="space-y-4">
        <!-- Essential cookies -->
        <UCard variant="subtle" :ui="{ body: 'p-4' }">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 space-y-1">
              <p class="text-sm font-semibold">
                {{ t('cookies.settings.essential.title') }}
              </p>
              <p class="text-muted text-xs">
                {{ t('cookies.settings.essential.description') }}
              </p>
            </div>
            <UBadge color="neutral" variant="subtle" size="sm">
              {{ t('cookies.settings.essential.always') }}
            </UBadge>
          </div>
        </UCard>

        <!-- Analytics cookies -->
        <UCard variant="subtle" :ui="{ body: 'p-4' }">
          <div class="flex items-center justify-between gap-4">
            <div class="flex-1 space-y-1">
              <p class="text-sm font-semibold">
                {{ t('cookies.settings.analytics.title') }}
              </p>
              <p class="text-muted text-xs">
                {{ t('cookies.settings.analytics.description') }}
              </p>
            </div>
            <USwitch
              v-model="analyticsEnabled"
              :aria-label="t('cookies.settings.analytics.title')"
            />
          </div>
        </UCard>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton variant="ghost" color="neutral" @click="closeSettings">
          {{ t('common.close') }}
        </UButton>
        <UButton @click="handleSave">
          {{ t('cookies.settings.save') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
