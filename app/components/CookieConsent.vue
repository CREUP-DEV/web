<script setup lang="ts">
const rootRef = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

const { t } = useI18n()
const localePath = useLocalePath()
const cookiesPath = computed(() => `${localePath('/legal')}#cookies`)
const { showBanner, dismissBanner } = useCookieConsent()

const getFocusableElements = () => {
  const root = rootRef.value
  if (!root) {
    return []
  }

  return Array.from(
    root.querySelectorAll<HTMLElement>(
      [
        'a[href]',
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(', ')
    )
  ).filter((element) => !element.hasAttribute('disabled') && !element.hasAttribute('aria-hidden'))
}

const focusPrimaryAction = () => {
  rootRef.value?.querySelector<HTMLElement>('[data-cookie-consent-dismiss]')?.focus()
}

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (showBanner.value) {
    handleKeydown(event)
  }
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key !== 'Tab') {
    return
  }

  const focusables = getFocusableElements()
  if (!focusables.length) {
    return
  }

  const firstFocusable = focusables[0]
  const lastFocusable = focusables[focusables.length - 1]
  const activeElement = document.activeElement
  const isInsideBanner =
    activeElement instanceof HTMLElement && rootRef.value?.contains(activeElement)

  if (!isInsideBanner) {
    event.preventDefault()
    const target = (event.shiftKey ? lastFocusable : firstFocusable)!
    target.focus()
    return
  }

  if (event.shiftKey && activeElement === firstFocusable) {
    event.preventDefault()
    lastFocusable!.focus()
    return
  }

  if (!event.shiftKey && activeElement === lastFocusable) {
    event.preventDefault()
    firstFocusable!.focus()
  }
}

watch(
  showBanner,
  async (visible) => {
    if (!import.meta.client) {
      return
    }

    if (visible) {
      previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
      await nextTick()
      focusPrimaryAction()
      return
    }

    previousFocus?.focus()
    previousFocus = null
  },
  { immediate: true }
)

onMounted(() => {
  if (!import.meta.client) {
    return
  }

  document.addEventListener('keydown', onDocumentKeydown, true)
})

onBeforeUnmount(() => {
  if (!import.meta.client) {
    return
  }

  document.removeEventListener('keydown', onDocumentKeydown, true)
})
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
      ref="rootRef"
      role="alertdialog"
      aria-modal="true"
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
