<script setup lang="ts">
import { SPAIN_REGION_PATHS } from './spainRegions'

const props = defineProps<{
  selectedCommunity?: string | null
  memberCounts?: Record<string, number>
}>()

const emit = defineEmits<{
  (e: 'select', community: string | null): void
}>()

const { t } = useI18n()

const mapContainerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)
const tooltipId = 'members-map-tooltip'

const tooltip = ref({
  visible: false,
  title: '',
  meta: '',
})
const hoveredCommunity = ref<string | null>(null)

let tooltipAnimationFrameId = 0
let pendingTooltipPointerPosition: { clientX: number; clientY: number } | null = null

// Precomputed maps — only recompute when locale, selection, or counts change.
// This avoids re-evaluating every region's class/label on every render tick.

const communityNames = computed(() => {
  const map = new Map<string, string>()
  for (const { community } of SPAIN_REGION_PATHS) {
    const key = `members.communities.${community}`
    const translated = t(key)
    map.set(community, translated === key ? community : translated)
  }
  return map
})

const regionClassesStatic = computed(() => {
  const map = new Map<string, Record<string, boolean>>()
  for (const { community } of SPAIN_REGION_PATHS) {
    const hasMembers = (props.memberCounts?.[community] ?? 0) > 0
    const isSelected = props.selectedCommunity === community
    map.set(community, {
      'map-region': true,
      'map-region--selected': isSelected,
      'map-region--active': hasMembers && !isSelected,
      'map-region--inactive': !hasMembers && !isSelected,
    })
  }
  return map
})

const regionAriaLabels = computed(() => {
  const map = new Map<string, string>()
  for (const { community } of SPAIN_REGION_PATHS) {
    const name = communityNames.value.get(community) ?? community
    const count = props.memberCounts?.[community] ?? 0
    const countLabel =
      count > 0 ? t('members.mapTooltipCount', count) : t('members.mapTooltipEmpty')
    const stateLabel =
      props.selectedCommunity === community
        ? t('members.mapSelectedState')
        : count > 0
          ? t('members.mapAvailableState')
          : t('members.mapUnavailableState')
    map.set(community, [name, countLabel, stateLabel].join('. '))
  }
  return map
})

const handleSelect = (community: string) => {
  emit('select', props.selectedCommunity === community ? null : community)
}

const setHoverCommunity = (community: string) => {
  hoveredCommunity.value = community
}

const getCommunityCount = (community: string) => props.memberCounts?.[community] ?? 0

const getCommunityCountLabel = (community: string) => {
  const count = getCommunityCount(community)
  return count > 0 ? t('members.mapTooltipCount', count) : t('members.mapTooltipEmpty')
}

const setTooltipCoordinates = (x: number, y: number) => {
  if (!tooltipRef.value) {
    return
  }

  tooltipRef.value.style.left = `${x}px`
  tooltipRef.value.style.top = `${y}px`
}

const setTooltipPositionFromPointer = (clientX: number, clientY: number) => {
  if (!mapContainerRef.value) {
    return
  }

  const containerRect = mapContainerRef.value.getBoundingClientRect()
  setTooltipCoordinates(clientX - containerRect.left, clientY - containerRect.top)
}

const setTooltipPositionFromTarget = (target: EventTarget | null) => {
  if (!mapContainerRef.value) {
    return
  }

  const region = target as SVGPathElement | null
  if (!region) {
    return
  }

  const containerRect = mapContainerRef.value.getBoundingClientRect()
  const targetRect = region.getBoundingClientRect()

  setTooltipCoordinates(
    targetRect.left - containerRect.left + targetRect.width / 2,
    targetRect.top - containerRect.top
  )
}

const flushTooltipPosition = () => {
  tooltipAnimationFrameId = 0

  if (!pendingTooltipPointerPosition) {
    return
  }

  setTooltipPositionFromPointer(
    pendingTooltipPointerPosition.clientX,
    pendingTooltipPointerPosition.clientY
  )
  pendingTooltipPointerPosition = null
}

const scheduleTooltipPosition = (clientX: number, clientY: number) => {
  pendingTooltipPointerPosition = { clientX, clientY }

  if (tooltipAnimationFrameId) {
    return
  }

  tooltipAnimationFrameId = window.requestAnimationFrame(flushTooltipPosition)
}

const showTooltipFromPointer = (event: MouseEvent, community: string) => {
  setHoverCommunity(community)
  tooltip.value.title = communityNames.value.get(community) ?? community
  tooltip.value.meta = getCommunityCountLabel(community)
  tooltip.value.visible = true
  scheduleTooltipPosition(event.clientX, event.clientY)
}

const updateTooltipPosition = (event: MouseEvent) => {
  if (!tooltip.value.visible) {
    return
  }

  scheduleTooltipPosition(event.clientX, event.clientY)
}

const showTooltipFromFocus = (event: FocusEvent, community: string) => {
  setHoverCommunity(community)
  setTooltipPositionFromTarget(event.currentTarget ?? event.target)
  tooltip.value.title = communityNames.value.get(community) ?? community
  tooltip.value.meta = getCommunityCountLabel(community)
  tooltip.value.visible = true
}

const hideTooltip = () => {
  tooltip.value.visible = false
  hoveredCommunity.value = null
  pendingTooltipPointerPosition = null

  if (tooltipAnimationFrameId) {
    window.cancelAnimationFrame(tooltipAnimationFrameId)
    tooltipAnimationFrameId = 0
  }
}

onBeforeUnmount(() => {
  if (tooltipAnimationFrameId) {
    window.cancelAnimationFrame(tooltipAnimationFrameId)
  }
})
</script>

<template>
  <div
    ref="mapContainerRef"
    class="relative w-full [--map-active-fill:#fecaca] [--map-active-hover-fill:#fb7185] [--map-active-hover-opacity:1] [--map-active-hover-stroke:#991b1b] [--map-active-opacity:1] [--map-active-stroke:#b91c1c] [--map-inactive-fill:#d1d5db] [--map-inactive-hover-fill:#94a3b8] [--map-inactive-hover-stroke:#64748b] [--map-inactive-stroke:#9ca3af] [--map-selected-fill:#dc2626] [--map-selected-hover-fill:#ef4444] [--map-selected-hover-stroke:#7f1d1d] [--map-selected-stroke:#991b1b] [--map-watermark-fill:#000] dark:[--map-active-fill:#b23c50] dark:[--map-active-hover-fill:#c95769] dark:[--map-active-hover-opacity:1] dark:[--map-active-hover-stroke:#ffd7dd] dark:[--map-active-opacity:1] dark:[--map-active-stroke:#f1a7b1] dark:[--map-inactive-fill:#3b475d] dark:[--map-inactive-hover-fill:#51627d] dark:[--map-inactive-hover-stroke:#d7dee8] dark:[--map-inactive-stroke:#71839e] dark:[--map-selected-fill:#e16b7e] dark:[--map-selected-hover-fill:#f08a99] dark:[--map-selected-hover-stroke:#ffe5e9] dark:[--map-selected-stroke:#ffd0d7] dark:[--map-watermark-fill:#d1d5db]"
  >
    <svg
      viewBox="0 0 1282.91 843.72"
      class="h-auto w-full"
      role="group"
      :aria-label="t('members.selectCommunity')"
    >
      <desc>{{ t('members.mapAccessibleHelp') }}</desc>

      <path
        v-for="region in SPAIN_REGION_PATHS"
        :key="`${region.svgId}-hit`"
        :d="region.d"
        class="map-region-hit"
        aria-hidden="true"
        tabindex="-1"
        @click="handleSelect(region.community)"
        @mouseenter="showTooltipFromPointer($event, region.community)"
        @mousemove="updateTooltipPosition($event)"
        @mouseleave="hideTooltip"
      />

      <path
        v-for="region in SPAIN_REGION_PATHS"
        :key="region.svgId"
        :d="region.d"
        :class="[
          regionClassesStatic.get(region.community),
          hoveredCommunity === region.community && selectedCommunity !== region.community
            ? 'map-region--hovered'
            : '',
        ]"
        tabindex="0"
        role="button"
        focusable="true"
        :aria-label="regionAriaLabels.get(region.community)"
        :aria-describedby="tooltipId"
        :aria-pressed="selectedCommunity === region.community"
        @click="handleSelect(region.community)"
        @keydown.enter.prevent="handleSelect(region.community)"
        @keydown.space.prevent="handleSelect(region.community)"
        @mouseenter="showTooltipFromPointer($event, region.community)"
        @mousemove="updateTooltipPosition($event)"
        @mouseleave="hideTooltip"
        @focus="showTooltipFromFocus($event, region.community)"
        @blur="hideTooltip"
      >
        <title>{{ communityNames.get(region.community) }}</title>
      </path>

      <g class="map-inset" aria-hidden="true">
        <rect x="914" y="677" width="362" height="164" rx="6" class="map-inset-frame" />
      </g>
    </svg>

    <div
      v-show="tooltip.visible"
      :id="tooltipId"
      ref="tooltipRef"
      class="pointer-events-none absolute z-20 min-w-32 rounded-md bg-black/85 px-3 py-2 text-xs text-white shadow-lg"
      style="left: 0; top: 0; transform: translate(-50%, calc(-100% - 0.5rem))"
      role="tooltip"
    >
      <p class="font-semibold">{{ tooltip.title }}</p>
      <p class="mt-0.5 text-white/80">{{ tooltip.meta }}</p>
    </div>

    <div class="mt-4 flex justify-end px-1">
      <a
        href="https://www.mapchart.net/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-muted rounded-full bg-white/85 px-2.5 py-1 text-[11px] leading-none shadow-sm ring-1 ring-gray-200/70 backdrop-blur transition-colors hover:text-gray-900 dark:bg-gray-900/85 dark:ring-gray-700/70 dark:hover:text-white"
      >
        Created with mapchart.net
      </a>
    </div>
  </div>
</template>

<style scoped>
.map-region {
  fill: #d1dbdd;
  stroke: #6a0707;
  stroke-width: 1.5;
  transition:
    fill 0.15s ease,
    transform 0.15s ease,
    filter 0.15s ease;
  vector-effect: non-scaling-stroke;
  transform-box: fill-box;
  transform-origin: center;
  pointer-events: none;
}

.map-region-hit {
  cursor: pointer;
  fill: rgb(255 255 255 / 0.001);
  stroke: transparent;
  stroke-width: 22;
  pointer-events: all;
}

.map-region:focus {
  outline: none;
}

.map-region:focus-visible {
  stroke-width: 2.5;
}

.map-region--hovered,
.map-region:focus-visible {
  filter: drop-shadow(0 8px 18px rgb(106 7 7 / 0.18));
  transform: translateY(-1px) scale(1.01);
}

.map-region--selected {
  fill: var(--map-selected-fill);
  stroke: var(--map-selected-stroke);
}

.map-region--selected:hover,
.map-region--selected:focus-visible {
  fill: var(--map-selected-hover-fill);
  stroke: var(--map-selected-hover-stroke);
}

.map-region--active {
  fill: var(--map-active-fill);
  stroke: var(--map-active-stroke);
  opacity: var(--map-active-opacity);
}

.map-region--active:hover,
.map-region--active:focus-visible {
  fill: var(--map-active-hover-fill);
  stroke: var(--map-active-hover-stroke);
  opacity: var(--map-active-hover-opacity);
}

.map-region--inactive {
  fill: var(--map-inactive-fill);
  stroke: var(--map-inactive-stroke);
}

.map-region--inactive:hover,
.map-region--inactive:focus-visible {
  fill: var(--map-inactive-hover-fill);
  stroke: var(--map-inactive-hover-stroke);
}

.map-inset-frame {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-dasharray: 7 6;
  opacity: 0.55;
}
</style>
