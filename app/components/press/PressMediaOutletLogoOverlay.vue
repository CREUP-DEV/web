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
    return `${shellBase} inline-flex max-w-full items-center justify-center rounded-xl px-5 py-4 sm:px-6 sm:py-5`
  }

  const shell = `${shellBase} rounded-md`

  if (props.variant === 'detail') {
    return `${shell} absolute right-3 bottom-3 z-10 max-w-[min(22rem,calc(100%-1.25rem))] px-3 py-2.5 sm:right-5 sm:bottom-5 sm:max-w-[min(26rem,calc(100%-2rem))] sm:px-4 sm:py-3`
  }

  return `${shell} pointer-events-none absolute right-2 bottom-2 z-10 max-w-[min(9rem,calc(100%-1rem))] px-1.5 py-1`
})

const frameClass = computed(() =>
  isDetailSize.value
    ? 'relative flex min-h-[3.25rem] min-w-[9rem] items-center justify-center sm:min-h-[4.25rem] sm:min-w-[11rem]'
    : 'relative flex min-h-6 min-w-[4.75rem] items-center justify-center'
)

const skeletonClass = computed(() =>
  isDetailSize.value
    ? 'absolute inset-x-1 inset-y-1 z-0 rounded-md sm:inset-x-1.5 sm:inset-y-1.5'
    : 'absolute inset-1 z-0 rounded-sm'
)

const imgWidth = computed(() => (isDetailSize.value ? 420 : 180))
const imgHeight = computed(() => (isDetailSize.value ? 56 : 24))
const imgClass = computed(() =>
  isDetailSize.value
    ? 'relative z-[1] mx-auto block max-h-14 w-auto max-w-full object-contain sm:max-h-[4.5rem]'
    : 'relative z-[1] mx-auto block max-h-6 w-auto max-w-full object-contain'
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
        <NuxtImg
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
      <NuxtImg
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
