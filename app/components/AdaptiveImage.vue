<script setup lang="ts">
import { getUrlPathname, getUrlSearchParam } from '~~/shared/utils/url'

defineOptions({
  inheritAttrs: false,
})

type ResponsiveSizes = string | Record<string, string | number>

const props = withDefaults(
  defineProps<{
    src?: string | null
    alt: string
    width?: string | number
    height?: string | number
    sizes?: ResponsiveSizes
    densities?: string
    fit?: string
    format?: string
    quality?: string | number
    loading?: 'lazy' | 'eager'
    decoding?: 'async' | 'auto' | 'sync'
  }>(),
  {
    src: null,
    width: undefined,
    height: undefined,
    sizes: undefined,
    densities: undefined,
    fit: undefined,
    format: undefined,
    quality: undefined,
    loading: 'lazy',
    decoding: 'async',
  }
)

const emit = defineEmits<{
  load: [event: Event]
  error: [event: Event]
}>()

const attrs = useAttrs()
const img = useImage()
const plainSizes = computed(() => (typeof props.sizes === 'string' ? props.sizes : undefined))

const isSvgAsset = computed(() => {
  if (!props.src) {
    return false
  }

  const pathname = getUrlPathname(props.src).toLowerCase()
  return getUrlSearchParam(props.src, '__imgkind') === 'svg' || pathname.endsWith('.svg')
})

const rasterModifiers = computed(() => ({
  width: props.width,
  height: props.height,
  fit: props.fit,
  format: props.format,
  quality: props.quality,
}))

const rasterImage = computed(() => {
  if (!props.src || isSvgAsset.value) {
    return null
  }

  const options = {
    sizes: props.sizes,
    densities: props.densities,
    modifiers: rasterModifiers.value,
  }

  const resolvedSizes = props.sizes ? img.getSizes(props.src, options) : null

  return {
    src: resolvedSizes?.src || img(props.src, rasterModifiers.value),
    srcset: resolvedSizes?.srcset,
    sizes: resolvedSizes?.sizes,
  }
})

const imageAttrs = computed(() => ({
  ...attrs,
  alt: props.alt,
  decoding: props.decoding,
  height: props.height,
  loading: props.loading,
  sizes: isSvgAsset.value ? plainSizes.value : (rasterImage.value?.sizes ?? undefined),
  src: isSvgAsset.value
    ? (props.src ?? undefined)
    : (rasterImage.value?.src ?? props.src ?? undefined),
  srcset: isSvgAsset.value ? undefined : (rasterImage.value?.srcset ?? undefined),
  width: props.width,
}))
</script>

<template>
  <img
    v-if="props.src"
    v-bind="imageAttrs"
    @load="emit('load', $event)"
    @error="emit('error', $event)"
  />
</template>
