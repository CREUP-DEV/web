<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    brText?: string
    width?: number
    height?: number
    stroke?: string
    strokeWidth?: number
  }>(),
  {
    brText:
      'La Coordinadora de Representantes de Estudiantes de Universidades Públicas (CREUP) es la asociación estatal que representa a más de 1.000.000 de estudiantes. Formado actualmente por 39 universidades públicas y en constante crecimiento, 22 años elevando la voz del estudiantado a los organismos competentes en materia de educación superior tanto a nivel nacional como internacional.',
    width: 600,
    height: 600,
    stroke: '#792225',
    strokeWidth: 3,
  }
)

const hasText = computed(() => (props.brText ?? '').trim().length > 0)

// SVG viewBox dimensions (user units)
const VB_WIDTH = 153
const VB_HEIGHT = 153
// Offsets: move content left/up by one sixth of the SVG size
const offsetX = -VB_WIDTH / 6
const offsetY = -VB_HEIGHT / 6

// Text fit box (matches the clipped bottom-right circle area 100x100) and padding
const TEXT_BOX_WIDTH = 100
const TEXT_BOX_HEIGHT = 100
const TEXT_PADDING = 8 // matches p-2 applied in markup
const SAFE_INSET = 6 // extra breathing room so text doesn't touch the circle edge

// Compute a font size that ensures the whole text fits inside the clipped circle.
// Uses a width/height heuristic and binary search. No lower bound clamp.
const computedFontPx = computed(() => {
  const raw = (props.brText ?? '').trim()
  if (!raw) return 12

  const AVG_CHAR_WIDTH_EM = 0.55
  const LINE_HEIGHT_FACTOR = 1.15
  // Reserve extra space beyond the actual padding to avoid touching the border
  const innerW = TEXT_BOX_WIDTH - 2 * (TEXT_PADDING + SAFE_INSET)
  const innerH = TEXT_BOX_HEIGHT - 2 * (TEXT_PADDING + SAFE_INSET)

  const fits = (f: number) => {
    const charsPerLine = Math.max(1, Math.floor(innerW / (AVG_CHAR_WIDTH_EM * f)))
    const lines = Math.ceil(raw.length / charsPerLine)
    const totalH = lines * (f * LINE_HEIGHT_FACTOR)
    return totalH <= innerH
  }

  let lo = 0.5
  let hi = 22 // reasonable visual upper bound for this layout
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2
    if (fits(mid)) lo = mid
    else hi = mid
  }
  // Make it slightly smaller than the max fit for extra breathing room
  return lo * 0.9
})

// Clamp rendered size so it never exceeds the viewport width
const viewportWidth = ref<number | null>(null)
let _onResize: (() => void) | null = null

onMounted(() => {
  const update = () => {
    viewportWidth.value = window.innerWidth || null
  }
  _onResize = update
  update()
  window.addEventListener('resize', update)
})

onBeforeUnmount(() => {
  if (_onResize) window.removeEventListener('resize', _onResize)
})

const effWidth = computed(() => {
  const vw = viewportWidth.value
  return Math.min(props.width, vw ?? props.width)
})

const effHeight = computed(() => {
  const vw = viewportWidth.value
  return Math.min(props.height, vw ?? props.height)
})
</script>

<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="effWidth"
    :height="effHeight"
    viewBox="0 0 153 153"
    style="overflow: hidden"
    aria-hidden="true"
    role="img"
  >
    <defs>
      <clipPath id="clip-br">
        <circle cx="101.5" cy="101.5" r="50" />
      </clipPath>
    </defs>

    <!-- Wrap all drawable content in a translated group; overflow is hidden by the SVG -->
    <g :transform="`translate(${offsetX}, ${offsetY})`">
      <!-- 1) Draw the other two circles first (their strokes may enter BR area) -->
      <g fill="none" :stroke="stroke" :stroke-width="strokeWidth">
        <!-- Top -->
        <circle cx="76.5" cy="51.5" r="50" />
        <!-- Bottom-left -->
        <circle cx="51.5" cy="101.5" r="50" />
      </g>

      <!-- 2) If there is text, place a solid white fill to hide intersections -->
      <!--    No stroke, and placed BEFORE the BR stroke so its border remains visible -->
      <circle v-if="hasText" cx="101.5" cy="101.5" r="50" fill="white" />

      <!-- 3) If there is text, render it clipped to the circle ABOVE the white fill -->
      <foreignObject
        v-if="hasText"
        x="51.5"
        y="51.5"
        width="100"
        height="100"
        clip-path="url(#clip-br)"
      >
        <div
          xmlns="http://www.w3.org/1999/xhtml"
          class="flex h-full w-full items-center justify-center p-2"
        >
          <div
            class="text-center leading-snug wrap-break-word [word-break:break-word]"
            :style="{ fontSize: computedFontPx + 'px', lineHeight: 1.15 }"
          >
            {{ brText }}
          </div>
        </div>
      </foreignObject>

      <!-- 4) Draw the bottom-right stroke last so the border stays visible above text -->
      <circle
        cx="101.5"
        cy="101.5"
        r="50"
        fill="none"
        :stroke="stroke"
        :stroke-width="strokeWidth"
      />
    </g>
  </svg>
</template>
