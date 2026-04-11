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
const regionRefs = ref<Array<SVGPathElement | null>>([])

const tooltip = ref({
  visible: false,
  title: '',
  meta: '',
})
const hoveredCommunity = ref<string | null>(null)
const activeCommunity = ref(props.selectedCommunity ?? SPAIN_REGION_PATHS[0]?.community ?? '')

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
  activeCommunity.value = community
  emit('select', props.selectedCommunity === community ? null : community)
}

watch(
  () => props.selectedCommunity,
  (community) => {
    if (community && SPAIN_REGION_PATHS.some((region) => region.community === community)) {
      activeCommunity.value = community
    }
  }
)

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
  activeCommunity.value = community
  setHoverCommunity(community)
  setTooltipPositionFromTarget(event.currentTarget ?? event.target)
  tooltip.value.title = communityNames.value.get(community) ?? community
  tooltip.value.meta = getCommunityCountLabel(community)
  tooltip.value.visible = true
}

const setRegionRef = (el: SVGPathElement | null, index: number) => {
  regionRefs.value[index] = el
}

const focusRegionAtIndex = async (index: number) => {
  const totalRegions = SPAIN_REGION_PATHS.length

  if (!totalRegions) {
    return
  }

  const nextIndex = ((index % totalRegions) + totalRegions) % totalRegions
  const nextRegion = SPAIN_REGION_PATHS[nextIndex]
  if (!nextRegion) {
    return
  }

  activeCommunity.value = nextRegion.community
  await nextTick()
  regionRefs.value[nextIndex]?.focus()
}

const handleRegionKeydown = (event: KeyboardEvent, index: number, community: string) => {
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      event.preventDefault()
      void focusRegionAtIndex(index + 1)
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      event.preventDefault()
      void focusRegionAtIndex(index - 1)
      break
    case 'Home':
      event.preventDefault()
      void focusRegionAtIndex(0)
      break
    case 'End':
      event.preventDefault()
      void focusRegionAtIndex(SPAIN_REGION_PATHS.length - 1)
      break
    case 'Enter':
    case ' ':
      event.preventDefault()
      handleSelect(community)
      break
  }
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
        v-for="(region, index) in SPAIN_REGION_PATHS"
        :key="region.svgId"
        :ref="(el) => setRegionRef(el as SVGPathElement | null, index)"
        :d="region.d"
        :class="[
          regionClassesStatic.get(region.community),
          hoveredCommunity === region.community && selectedCommunity !== region.community
            ? 'map-region--hovered'
            : '',
        ]"
        :tabindex="activeCommunity === region.community ? 0 : -1"
        role="button"
        focusable="true"
        :aria-label="regionAriaLabels.get(region.community)"
        :aria-describedby="tooltipId"
        :aria-pressed="selectedCommunity === region.community"
        @click="handleSelect(region.community)"
        @keydown="handleRegionKeydown($event, index, region.community)"
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
      class="members-map-tooltip pointer-events-none absolute z-20 min-w-32 rounded-md px-3 py-2 text-xs shadow-lg"
      style="left: 0; top: 0; transform: translate(-50%, calc(-100% - 0.5rem))"
      role="tooltip"
    >
      <p class="font-semibold">{{ tooltip.title }}</p>
      <p class="members-map-tooltip-meta mt-0.5">{{ tooltip.meta }}</p>
    </div>

    <div class="mt-4 flex justify-end px-1">
      <a
        href="https://www.mapchart.net/"
        target="_blank"
        rel="noopener noreferrer"
        class="text-muted hover:text-foreground bg-background/85 rounded-full px-2.5 py-1 text-[11px] leading-none shadow-sm backdrop-blur transition-colors"
      >
        Created with mapchart.net
      </a>
    </div>
  </div>
</template>

<style scoped>
.map-region {
  fill: var(--members-map-base-fill);
  stroke: var(--members-map-base-stroke);
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
  filter: drop-shadow(0 8px 18px var(--members-map-hover-shadow));
  transform: translateY(-1px) scale(1.01);
}

.map-region--selected {
  fill: var(--members-map-selected-fill);
  stroke: var(--members-map-selected-stroke);
}

.map-region--selected:hover,
.map-region--selected:focus-visible {
  fill: var(--members-map-selected-hover-fill);
  stroke: var(--members-map-selected-hover-stroke);
}

.map-region--active {
  fill: var(--members-map-active-fill);
  stroke: var(--members-map-active-stroke);
}

.map-region--active:hover,
.map-region--active:focus-visible {
  fill: var(--members-map-active-hover-fill);
  stroke: var(--members-map-active-hover-stroke);
}

.map-region--inactive {
  fill: var(--members-map-inactive-fill);
  stroke: var(--members-map-inactive-stroke);
}

.map-region--inactive:hover,
.map-region--inactive:focus-visible {
  fill: var(--members-map-inactive-hover-fill);
  stroke: var(--members-map-inactive-hover-stroke);
}

.map-inset-frame {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-dasharray: 7 6;
  opacity: var(--members-map-frame-opacity);
}

@media (prefers-reduced-motion: reduce) {
  .map-region {
    transition: none;
  }

  .map-region--hovered,
  .map-region:focus-visible {
    filter: none;
    transform: none;
  }
}
</style>
