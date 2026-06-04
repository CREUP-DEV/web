<script setup lang="ts">
interface SparklinePoint {
  clientError: number
  minute: number
  serverError: number
  total: number
}

const props = withDefaults(
  defineProps<{
    points: SparklinePoint[]
    height?: number
    width?: number
  }>(),
  {
    height: 48,
    width: 240,
  }
)

const PADDING = 4

const maxValue = computed(() => Math.max(1, ...props.points.map((point) => point.total)))

const coordinates = computed(() => {
  const count = props.points.length
  if (count === 0) {
    return []
  }

  const innerWidth = props.width - PADDING * 2
  const innerHeight = props.height - PADDING * 2
  const step = count > 1 ? innerWidth / (count - 1) : 0

  return props.points.map((point, index) => ({
    point,
    x: PADDING + step * index,
    y: PADDING + innerHeight * (1 - point.total / maxValue.value),
  }))
})

const linePath = computed(() =>
  coordinates.value
    .map((coordinate, index) => `${index === 0 ? 'M' : 'L'} ${coordinate.x} ${coordinate.y}`)
    .join(' ')
)

const areaPath = computed(() => {
  if (coordinates.value.length === 0) {
    return ''
  }

  const baseline = props.height - PADDING
  const first = coordinates.value[0]!
  const last = coordinates.value[coordinates.value.length - 1]!

  return `${linePath.value} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
})

const errorMarkers = computed(() =>
  coordinates.value.filter((coordinate) => coordinate.point.serverError > 0)
)
</script>

<template>
  <svg
    :viewBox="`0 0 ${width} ${height}`"
    :width="width"
    :height="height"
    preserveAspectRatio="none"
    class="text-primary h-12 w-full"
    role="img"
    aria-hidden="true"
  >
    <path :d="areaPath" fill="currentColor" fill-opacity="0.12" stroke="none" />
    <path
      :d="linePath"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
    <circle
      v-for="marker in errorMarkers"
      :key="marker.point.minute"
      :cx="marker.x"
      :cy="marker.y"
      r="2.5"
      class="fill-error"
    />
  </svg>
</template>
