<script setup lang="ts">
let previousFocus: HTMLElement | null = null

const { t } = useI18n()
const localePath = useLocalePath()
const cookiesPath = computed(() => `${localePath('/legal')}#cookies`)
const { showBanner, dismissBanner } = useCookieConsent()

// The banner is the last element in layouts/default.vue, so it is reachable in
// natural tab order without a focus trap. We only remember where focus was when
// the banner appeared so it can be restored once the banner is dismissed.
watch(
  showBanner,
  (visible) => {
    if (!import.meta.client) {
      return
    }

    if (visible) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      return
    }

    previousFocus?.focus()
    previousFocus = null
  },
  { immediate: true }
)
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="showBanner"
      role="region"
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      class="fixed inset-x-0 bottom-0 z-50 p-4"
    >
      <UCard class="mx-auto max-w-3xl" :ui="{ body: 'space-y-4' }">
        <div class="flex items-start gap-3">
          <UIcon name="i-tabler-cookie" class="text-primary mt-0.5 size-6 shrink-0" />
          <div class="flex-1 space-y-1">
            <p id="cookie-consent-title" class="text-sm font-semibold">
              {{ t('cookies.banner.title') }}
            </p>
            <p id="cookie-consent-description" class="text-muted text-sm">
              {{ t('cookies.banner.description') }}
            </p>
          </div>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <NuxtLink
            :to="cookiesPath"
            class="text-primary inline-flex items-center text-sm font-medium hover:underline"
            data-cookie-consent-link
          >
            {{ t('cookies.banner.learnMore') }}
          </NuxtLink>

          <UButton
            size="md"
            class="justify-center sm:w-auto"
            data-cookie-consent-dismiss
            @click="dismissBanner"
          >
            {{ t('cookies.banner.dismiss') }}
          </UButton>
        </div>
      </UCard>
    </div>
  </Transition>
</template>
