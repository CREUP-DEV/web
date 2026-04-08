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

const regionClasses = computed(() => {
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
  setTooltipPositionFromTarget(event.currentTarget ?? event.target)
  tooltip.value.title = communityNames.value.get(community) ?? community
  tooltip.value.meta = getCommunityCountLabel(community)
  tooltip.value.visible = true
}

const hideTooltip = () => {
  tooltip.value.visible = false
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
    class="relative w-full [--map-active-fill:#fecaca] [--map-active-hover-fill:#fb7185] [--map-active-hover-opacity:1] [--map-active-hover-stroke:#991b1b] [--map-active-opacity:1] [--map-active-stroke:#b91c1c] [--map-inactive-fill:#d1d5db] [--map-inactive-hover-fill:#94a3b8] [--map-inactive-hover-stroke:#64748b] [--map-inactive-stroke:#9ca3af] [--map-selected-fill:#dc2626] [--map-selected-hover-fill:#ef4444] [--map-selected-hover-stroke:#7f1d1d] [--map-selected-stroke:#991b1b] [--map-watermark-fill:#000] dark:[--map-active-fill:#dc2626] dark:[--map-active-hover-fill:#f87171] dark:[--map-active-hover-opacity:0.95] dark:[--map-active-hover-stroke:#fee2e2] dark:[--map-active-opacity:0.8] dark:[--map-active-stroke:#fca5a5] dark:[--map-inactive-fill:#4b5563] dark:[--map-inactive-hover-fill:#9ca3af] dark:[--map-inactive-hover-stroke:#cbd5e1] dark:[--map-inactive-stroke:#6b7280] dark:[--map-selected-fill:#f87171] dark:[--map-selected-hover-fill:#fca5a5] dark:[--map-selected-hover-stroke:#fee2e2] dark:[--map-selected-stroke:#fca5a5] dark:[--map-watermark-fill:#d1d5db]"
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
        :key="region.svgId"
        :d="region.d"
        :class="regionClasses.get(region.community)"
        tabindex="0"
        role="button"
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

      <g class="map-overlay" aria-hidden="true">
        <rect x="914" y="677" width="362" height="164" rx="4" class="map-canary-frame" />
        <text id="credit-text-svg" class="map-watermark-text">
          <tspan id="credit-tspan-svg" x="1164.6756326293946" y="834.3450009536743" dy="0">
            Created with mapchart.net
          </tspan>
        </text>
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
  </div>
</template>

<style scoped>
.map-region {
  cursor: pointer;
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
}

.map-region:focus {
  outline: none;
}

.map-region:focus-visible {
  stroke-width: 2.5;
}

.map-region:hover,
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

.map-overlay {
  pointer-events: none;
}

.map-canary-frame {
  fill: none;
  stroke: #000;
  stroke-width: 1;
  stroke-dasharray: 5 4;
}

.map-watermark-text {
  fill: var(--map-watermark-fill);
  font-family: 'Century Gothic', 'Segoe UI', 'Lucida Grande', sans-serif;
  font-size: 7.5px;
  font-weight: 700;
}
</style>
