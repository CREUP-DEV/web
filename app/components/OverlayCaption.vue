<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useWindowSize } from '@vueuse/core'
import type { CSSProperties } from 'vue'

interface Props {
  title: string
  href?: string
  linkText?: string
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  /** Percentages (0-100) of the ANCHOR area (image) the overlay should occupy */
  widthPct?: number
  /** Rounded class to match the parent corners (e.g., 'rounded-xl'). Parent should clip (overflow-hidden). */
  radiusClass?: string
  /** CSS selector to find the element that represents the image area to anchor to. Defaults to the first <img> */
  anchorSelector?: string
  /** Inner margin from the image corner in pixels */
  inset?: number
  /** Rounded class for the overlay panel (all corners) */
  overlayRadiusClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  linkText: 'Ver más',
  href: undefined,
  position: 'bottom-right',
  widthPct: 45,
  radiusClass: 'rounded-xl',
  anchorSelector: 'img',
  inset: 12,
  overlayRadiusClass: 'rounded-lg',
})

const rootRef = ref<Element | null>(null)
const bounds = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
})
let ro: ResizeObserver | null = null

// Window width to drive responsive behavior
const { width } = useWindowSize()
const isDesktop = computed(() => width.value >= 1280)

function updateBounds() {
  const root = rootRef.value
  if (!root) return
  const rootRect = root.getBoundingClientRect()
  const anchorEl = (root.querySelector(props.anchorSelector!) ||
    root.querySelector('picture img')) as HTMLElement | null
  const aRect = anchorEl?.getBoundingClientRect()
  if (aRect) {
    bounds.value = {
      top: aRect.top - rootRect.top,
      left: aRect.left - rootRect.left,
      width: aRect.width,
      height: aRect.height,
    }
  } else {
    // Fallback to the full container
    bounds.value = {
      top: 0,
      left: 0,
      width: root.clientWidth,
      height: root.clientHeight,
    }
  }
}

onMounted(() => {
  updateBounds()
  // Observe size changes on the root – covers window resizes and layout shifts
  ro = new ResizeObserver(() => updateBounds())
  const root = rootRef.value
  if (root) ro.observe(root as unknown as Element)
  // Also try to observe the image if present initially
  const img = root?.querySelector(props.anchorSelector!) as Element | null
  if (img) ro.observe(img as unknown as Element)
  // Update when viewport width changes
  watch(
    width,
    () => {
      updateBounds()
    },
    {
      immediate: false,
    }
  )
})

onBeforeUnmount(() => {
  ro?.disconnect()
  ro = null
})

const offsetStyle = computed<CSSProperties>(() => {
  const inset = `${props.inset}px`
  switch (props.position) {
    case 'top-left':
      return {
        top: inset,
        left: inset,
      }
    case 'top-right':
      return {
        top: inset,
        right: inset,
      }
    case 'bottom-left':
      return {
        bottom: inset,
        left: inset,
      }
    default:
      return {
        bottom: inset,
        right: inset,
      }
  }
})

const overlayStyle = computed<CSSProperties>(() => {
  const insetTotal = props.inset * 2
  return {
    width: `${props.widthPct}%`,
    maxHeight: `calc(100% - ${insetTotal}px)`,
    ...offsetStyle.value,
  }
})

const imgBoxStyle = computed(() => ({
  top: `${bounds.value.top}px`,
  left: `${bounds.value.left}px`,
  width: `${bounds.value.width}px`,
  height: `${bounds.value.height}px`,
}))

// Expose image width as a CSS variable so we can scale text/button fluidly
const rootStyle = computed<CSSProperties>(() => ({
  '--oc-img-w': `${bounds.value.width}px`,
}))

// Style for the stacked (under-image) variant: same width and left offset as image
const stackedStyle = computed<CSSProperties>(() => ({
  width: `${bounds.value.width}px`,
  marginLeft: `${bounds.value.left}px`,
}))
</script>

<template>
  <!-- Make wrapper clip children so overlay corners coincide with parent's rounded corners -->
  <div ref="rootRef" class="relative overflow-hidden" :class="radiusClass" :style="rootStyle">
    <slot />

    <!-- Desktop: overlay over image -->
    <div v-if="isDesktop" class="absolute" :style="imgBoxStyle">
      <div class="absolute" :style="overlayStyle">
        <div
          class="bg-muted/75 flex max-h-full w-full flex-col gap-3 overflow-y-auto p-4 shadow-lg backdrop-blur-sm"
          :class="overlayRadiusClass"
        >
          <h3 class="oc-title line-clamp-3 leading-snug font-semibold">
            {{ title }}
          </h3>
          <div class="flex justify-center">
            <UButton
              v-if="href"
              class="oc-btn"
              color="primary"
              variant="soft"
              size="lg"
              :to="href"
              rel="noopener noreferrer"
            >
              {{ linkText }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile/Tablet: overlay under image -->
    <div v-else>
      <div
        class="bg-muted/75 flex flex-col gap-3 p-4 shadow-lg backdrop-blur-sm"
        :class="[overlayRadiusClass, 'rounded-t-none']"
        :style="stackedStyle"
      >
        <h3 class="oc-title line-clamp-3 leading-snug font-semibold">
          {{ title }}
        </h3>
        <div class="flex justify-center">
          <UButton
            v-if="href"
            class="oc-btn"
            color="primary"
            variant="soft"
            size="md"
            :to="href"
            rel="noopener noreferrer"
          >
            {{ linkText }}
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Fluid typography and button sizing based on the measured image width */
.oc-title {
  /* Slightly smaller: ~14px to ~18px, scale with image width */
  font-size: clamp(0.875rem, calc(var(--oc-img-w) / 20), 1.125rem);
}

.oc-btn {
  /* Slightly smaller button text */
  font-size: clamp(0.8125rem, calc(var(--oc-img-w) / 32), 0.9375rem);
}
</style>
