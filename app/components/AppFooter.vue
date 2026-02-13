<script setup lang="ts">
const { t } = useI18n()
const { openSettings } = useCookieConsent()

const socials = useSocials()

const leftColumn = ref<HTMLElement | null>(null)
const rightColumn = ref<HTMLElement | null>(null)
const sideColumnWidth = ref<number | null>(null)

let resizeObserver: ResizeObserver | null = null

function updateSideColumnWidth() {
  if (!leftColumn.value || !rightColumn.value) return

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches
  if (!isDesktop) {
    sideColumnWidth.value = null
    return
  }

  const leftWidth = leftColumn.value.scrollWidth
  const rightWidth = rightColumn.value.scrollWidth
  const shortest = Math.min(leftWidth, rightWidth)

  sideColumnWidth.value = shortest > 0 ? Math.round(shortest) : null
}

const sideColumnStyle = computed(() => {
  if (!sideColumnWidth.value) return undefined
  return { width: `${sideColumnWidth.value}px` }
})

onMounted(() => {
  updateSideColumnWidth()

  resizeObserver = new ResizeObserver(updateSideColumnWidth)

  if (leftColumn.value) {
    resizeObserver.observe(leftColumn.value)
  }

  if (rightColumn.value) {
    resizeObserver.observe(rightColumn.value)
  }

  window.addEventListener('resize', updateSideColumnWidth)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', updateSideColumnWidth)
})
</script>

<template>
  <UFooter>
    <template #left>
      <div ref="leftColumn" :style="sideColumnStyle">
        <p class="text-muted text-center text-sm sm:text-left">
          {{ t('footer.tagline') }} - {{ new Date().getFullYear() }}
        </p>
      </div>
    </template>

    <div class="flex items-center gap-1">
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
      <div ref="rightColumn" :style="sideColumnStyle" class="flex justify-end">
        <nav class="flex items-center gap-2 text-sm" :aria-label="t('footer.legalNav')">
          <NuxtLink
            to="/legal"
            class="text-muted hover:text-highlighted focus-visible:ring-primary/60 rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
          >
            {{ t('footer.legal') }}
          </NuxtLink>
          <span class="text-muted" aria-hidden="true">&middot;</span>
          <button
            type="button"
            class="text-muted hover:text-highlighted focus-visible:ring-primary/60 cursor-pointer rounded-sm transition focus-visible:ring-2 focus-visible:outline-none"
            @click="openSettings"
          >
            {{ t('cookies.editPreferences') }}
          </button>
        </nav>
      </div>
    </template>
  </UFooter>
</template>
