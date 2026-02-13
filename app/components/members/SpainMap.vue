<script setup lang="ts">
/**
 * Interactive map of Spain's autonomous communities.
 * Paths come from a MapChart export provided by the user.
 */

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

const tooltip = ref({
  visible: false,
  text: '',
  x: 0,
  y: 0,
})

const getCommunityName = (community: string) => {
  const key = `members.communities.${community}`
  const translated = t(key)
  return translated === key ? community : translated
}

const handleSelect = (community: string) => {
  if (props.selectedCommunity === community) {
    emit('select', null)
    return
  }

  emit('select', community)
}

const getRegionClass = (community: string) => {
  const hasMembers = (props.memberCounts?.[community] ?? 0) > 0
  const isSelected = props.selectedCommunity === community

  return {
    'map-region': true,
    'map-region--selected': isSelected,
    'map-region--active': hasMembers && !isSelected,
    'map-region--inactive': !hasMembers && !isSelected,
  }
}

const getRegionLabel = (community: string) => {
  const count = props.memberCounts?.[community] ?? 0
  return `${getCommunityName(community)} (${count})`
}

const setTooltipPosition = (clientX: number, clientY: number) => {
  if (!mapContainerRef.value) {
    return
  }

  const containerRect = mapContainerRef.value.getBoundingClientRect()
  tooltip.value.x = clientX - containerRect.left
  tooltip.value.y = clientY - containerRect.top
}

const showTooltip = (community: string) => {
  tooltip.value.text = getCommunityName(community)
  tooltip.value.visible = true
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const showTooltipFromPointer = (event: MouseEvent, community: string) => {
  showTooltip(community)
  setTooltipPosition(event.clientX, event.clientY)
}

const updateTooltipPosition = (event: MouseEvent) => {
  if (!tooltip.value.visible) {
    return
  }

  setTooltipPosition(event.clientX, event.clientY)
}

const showTooltipFromFocus = (event: FocusEvent, community: string) => {
  if (!mapContainerRef.value) {
    return
  }

  const target = event.target as SVGPathElement | null
  if (!target) {
    return
  }

  const containerRect = mapContainerRef.value.getBoundingClientRect()
  const targetRect = target.getBoundingClientRect()

  tooltip.value.x = targetRect.left - containerRect.left + targetRect.width / 2
  tooltip.value.y = targetRect.top - containerRect.top
  showTooltip(community)
}
</script>

<template>
  <div ref="mapContainerRef" class="relative w-full">
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
        :class="getRegionClass(region.community)"
        tabindex="0"
        role="button"
        :aria-label="getRegionLabel(region.community)"
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
        <title>{{ getCommunityName(region.community) }}</title>
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
      v-if="tooltip.visible"
      class="pointer-events-none absolute z-20 rounded-md bg-black/85 px-2 py-1 text-xs font-medium text-white"
      :style="{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
        transform: 'translate(-50%, calc(-100% - 0.5rem))',
      }"
      role="tooltip"
    >
      {{ tooltip.text }}
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
    stroke 0.15s ease,
    opacity 0.15s ease;
  vector-effect: non-scaling-stroke;
}

.map-region:focus {
  outline: none;
}

.map-region:focus-visible {
  stroke-width: 2.5;
}

.map-region--selected {
  fill: #dc2626;
  stroke: #991b1b;
}

.map-region--selected:hover,
.map-region--selected:focus-visible {
  fill: #ef4444;
}

.map-region--active {
  fill: #fecaca;
  stroke: #b91c1c;
}

.map-region--active:hover,
.map-region--active:focus-visible {
  fill: #fca5a5;
}

.map-region--inactive {
  fill: #d1d5db;
  stroke: #9ca3af;
}

.map-region--inactive:hover,
.map-region--inactive:focus-visible {
  fill: #cbd5e1;
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
  font-family: 'Century Gothic', 'Segoe UI', 'Lucida Grande', sans-serif;
  font-size: 7.5px;
  font-weight: 700;
  fill: #000;
}

:global(.dark) .map-region--selected {
  fill: #f87171;
  stroke: #fca5a5;
}

:global(.dark) .map-region--selected:hover,
:global(.dark) .map-region--selected:focus-visible {
  fill: #fca5a5;
}

:global(.dark) .map-region--active {
  fill: #dc2626;
  stroke: #fca5a5;
  opacity: 0.8;
}

:global(.dark) .map-region--active:hover,
:global(.dark) .map-region--active:focus-visible {
  fill: #ef4444;
  opacity: 0.95;
}

:global(.dark) .map-region--inactive {
  fill: #4b5563;
  stroke: #6b7280;
}

:global(.dark) .map-region--inactive:hover,
:global(.dark) .map-region--inactive:focus-visible {
  fill: #6b7280;
}

:global(.dark) .map-watermark-text {
  fill: #d1d5db;
}
</style>
