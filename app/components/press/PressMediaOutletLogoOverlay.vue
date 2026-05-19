<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    logoUrl: string
    outletName: string
    /** Thumbnail cards vs article hero */
    variant?: 'card' | 'detail'
    /** Centered badge when there is no cover image (detail page) */
    standalone?: boolean
    /**
     * External URL for the outlet. Only use when this badge is not inside another link
     * (e.g. article detail). Ignored for `variant="card"`.
     */
    outletWebsite?: string
  }>(),
  {
    variant: 'card',
    standalone: false,
    outletWebsite: '',
  }
)

const loaded = ref(false)

watch(
  () => props.logoUrl,
  () => {
    loaded.value = false
  }
)

const onImgLoad = () => {
  loaded.value = true
}

const onImgError = () => {
  loaded.value = true
}

const isCard = computed(() => props.variant === 'card' && !props.standalone)
const isDetailSize = computed(() => props.variant === 'detail' || props.standalone)
const showOutletLink = computed(() => Boolean(props.outletWebsite) && !isCard.value)

const rootClass = computed(() => {
  const shellBase = 'border-creup-dark-gray-200/80 bg-white border shadow-sm'

  if (props.standalone) {
    return `${shellBase} inline-flex max-w-full items-center justify-center rounded-xl px-4 py-3 sm:px-6 sm:py-5`
  }

  const shell = `${shellBase} rounded-md`

  if (props.variant === 'detail') {
    return `${shell} absolute right-3 bottom-3 z-10 max-w-[min(16rem,calc(100%-1.25rem))] px-2 py-1.5 lg:right-5 lg:bottom-5 lg:max-w-[min(26rem,calc(100%-2rem))] lg:px-4 lg:py-3`
  }

  return `${shell} pointer-events-none absolute right-2 bottom-2 z-10 max-w-[min(7rem,calc(100%-1rem))] px-1 py-0.5 lg:max-w-[min(9rem,calc(100%-1rem))] lg:px-1.5 lg:py-1`
})

const frameClass = computed(() =>
  isDetailSize.value
    ? 'relative flex min-h-9 min-w-[6.5rem] items-center justify-center lg:min-h-[4.25rem] lg:min-w-[11rem]'
    : 'relative flex min-h-5 min-w-[3.75rem] items-center justify-center lg:min-h-6 lg:min-w-[4.75rem]'
)

const skeletonClass = computed(() =>
  isDetailSize.value
    ? 'absolute inset-x-1 inset-y-1 z-0 rounded-md lg:inset-x-1.5 lg:inset-y-1.5'
    : 'absolute inset-1 z-0 rounded-sm'
)

const imgWidth = computed(() => (isDetailSize.value ? 420 : 180))
const imgHeight = computed(() => (isDetailSize.value ? 56 : 24))
const imgClass = computed(() =>
  isDetailSize.value
    ? 'relative z-[1] mx-auto block max-h-9 w-auto max-w-full object-contain lg:max-h-[4.5rem]'
    : 'relative z-[1] mx-auto block max-h-5 w-auto max-w-full object-contain lg:max-h-6'
)

const linkClass =
  'relative flex max-w-full items-center justify-center overflow-hidden rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/60'
</script>

<template>
  <div :class="rootClass">
    <div :class="frameClass">
      <USkeleton v-show="!loaded" :class="skeletonClass" />
      <a
        v-if="showOutletLink"
        :href="outletWebsite"
        target="_blank"
        rel="noopener noreferrer"
        :class="linkClass"
        :aria-label="outletName"
      >
        <AdaptiveImage
          :key="logoUrl"
          :src="logoUrl"
          :alt="outletName"
          :width="imgWidth"
          :height="imgHeight"
          fit="inside"
          :class="[imgClass, loaded ? 'opacity-100' : 'opacity-0']"
          loading="lazy"
          @load="onImgLoad"
          @error="onImgError"
        />
      </a>
      <AdaptiveImage
        v-else
        :key="logoUrl"
        :src="logoUrl"
        :alt="outletName"
        :width="imgWidth"
        :height="imgHeight"
        fit="inside"
        :class="[imgClass, loaded ? 'opacity-100' : 'opacity-0']"
        loading="lazy"
        @load="onImgLoad"
        @error="onImgError"
      />
    </div>
  </div>
</template>
