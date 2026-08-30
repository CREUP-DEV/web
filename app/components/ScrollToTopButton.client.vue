<script setup lang="ts">
import { useMediaQuery, useWindowScroll } from '@vueuse/core'

// Long pages (paginated archives above all) leave the reader far from the header, and changing
// page no longer scrolls the view back up, so offer an explicit way to return.
const REVEAL_OFFSET_PX = 600

const { t } = useI18n()
const { y } = useWindowScroll()
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const isVisible = computed(() => y.value > REVEAL_OFFSET_PX)

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion.value ? 'auto' : 'smooth' })
}
</script>

<template>
  <!--
    The fade lives on this wrapper rather than on the button: UButton's own base styles include
    `transition-colors`, which competes with the transition-property set by the enter/leave classes
    and cancels the fade.
  -->
  <Transition
    enter-active-class="transition duration-300 ease-out motion-reduce:transition-none"
    enter-from-class="translate-y-3 scale-90 opacity-0"
    enter-to-class="translate-y-0 scale-100 opacity-100"
    leave-active-class="transition duration-300 ease-in motion-reduce:transition-none"
    leave-from-class="translate-y-0 scale-100 opacity-100"
    leave-to-class="translate-y-3 scale-90 opacity-0"
  >
    <div v-show="isVisible" class="no-print fixed end-4 bottom-4 z-40">
      <UButton
        type="button"
        color="secondary"
        variant="solid"
        size="lg"
        icon="i-tabler-arrow-up"
        class="hover:bg-secondary active:bg-secondary rounded-full shadow-lg"
        :aria-label="t('accessibility.scrollToTop')"
        @click="scrollToTop"
      />
    </div>
  </Transition>
</template>
