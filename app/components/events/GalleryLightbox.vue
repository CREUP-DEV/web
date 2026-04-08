<script setup lang="ts">
import 'photoswipe/style.css'
import type PhotoSwipeLightbox from 'photoswipe/lightbox'
import type { EventGalleryImage } from '~/composables/useEvents'

type GalleryLightboxPhoto = EventGalleryImage & {
  url: string
}

type GallerySlide = {
  src: string
  width: number
  height: number
  alt: string
}

const props = defineProps<{
  open: boolean
  index: number
  photos: GalleryLightboxPhoto[]
  eventTitle: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:index': [value: number]
}>()

const { t } = useI18n()

let lightbox: PhotoSwipeLightbox | null = null

const totalPhotos = computed(() => props.photos.length)
const normalizedIndex = computed(() => {
  if (!totalPhotos.value) {
    return 0
  }

  return ((props.index % totalPhotos.value) + totalPhotos.value) % totalPhotos.value
})

const buildSlideDimensions = () => {
  const baseWidth = 1600
  const fallbackAspectRatio = 3 / 2
  const estimatedHeight = Math.round(baseWidth / fallbackAspectRatio)

  return {
    width: baseWidth,
    height: estimatedHeight,
  }
}

const slides = computed<GallerySlide[]>(() =>
  props.photos.map((photo, index) => {
    const dimensions = buildSlideDimensions()

    return {
      src: photo.url,
      width: dimensions.width,
      height: dimensions.height,
      alt: t('events.galleryPhotoAlt', {
        number: index + 1,
        event: props.eventTitle,
      }),
    }
  })
)

const syncLightboxDataSource = () => {
  if (!lightbox) {
    return
  }

  lightbox.options.dataSource = slides.value
}

const closeLightbox = () => {
  lightbox?.pswp?.close()
}

const openLightbox = () => {
  if (!lightbox || !slides.value.length || lightbox.pswp) {
    return
  }

  syncLightboxDataSource()
  lightbox.loadAndOpen(normalizedIndex.value)
}

onMounted(async () => {
  const { default: PhotoSwipeLightbox } = await import('photoswipe/lightbox')

  lightbox = new PhotoSwipeLightbox({
    bgOpacity: 0.92,
    dataSource: slides.value,
    loop: slides.value.length > 1,
    pswpModule: () => import('photoswipe'),
    returnFocus: true,
    showHideAnimationType: 'zoom',
  })

  lightbox.on('change', () => {
    const currentIndex = lightbox?.pswp?.currIndex

    if (typeof currentIndex === 'number') {
      emit('update:index', currentIndex)
    }
  })

  lightbox.on('close', () => {
    emit('update:open', false)
  })

  lightbox.on('destroy', () => {
    emit('update:open', false)
  })

  lightbox.init()

  if (props.open) {
    openLightbox()
  }
})

onBeforeUnmount(() => {
  lightbox?.destroy()
  lightbox = null
})

watch(
  () => props.photos,
  () => {
    syncLightboxDataSource()

    if (!props.photos.length) {
      emit('update:open', false)
      closeLightbox()
    }
  }
)

watch(
  () => props.open,
  (open) => {
    if (open) {
      openLightbox()
      return
    }

    closeLightbox()
  }
)

watch(
  () => props.index,
  () => {
    if (!lightbox?.pswp) {
      return
    }

    lightbox.pswp.goTo(normalizedIndex.value)
  }
)
</script>

<template>
  <span class="sr-only" aria-live="polite">
    {{
      open
        ? t('events.galleryCounter', {
            current: normalizedIndex + 1,
            total: totalPhotos,
          })
        : ''
    }}
  </span>
</template>
