<script setup lang="ts">
import type { EventGalleryImage } from '~/composables/useEvents'

type GalleryLightboxPhoto = EventGalleryImage & {
  url: string
}

const props = defineProps<{
  open: boolean
  index: number
  photos: GalleryLightboxPhoto[]
  eventTitle: string
  aspectRatios?: Record<number, number>
  initialAspectRatio?: number | null
  initialAspectRatioIndex?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'update:index': [value: number]
}>()

const { t } = useI18n()
const image = useImage()

const minZoom = 1
const zoomStep = 0.25
const emphasizedMotionEasing = 'cubic-bezier(0.16, 1, 0.3, 1)'
const lightboxImageWidth = 2200
const lightboxImageQuality = 82
const lightboxImageFormat = 'webp'
const lightboxImageModifiers = {
  width: lightboxImageWidth,
  quality: lightboxImageQuality,
  format: lightboxImageFormat,
} as const

const modalContentRef = ref<HTMLElement | null>(null)
const imageContainerRef = ref<HTMLElement | null>(null)
const imageStageRef = ref<HTMLElement | null>(null)

const supportsSwipeNavigation = ref(false)
const prefersReducedMotion = ref(false)
const viewportWidth = ref(0)
const viewportHeight = ref(0)

const loadedPhotos = reactive(new Set<number>())
const photoPreloads = new Map<number, Promise<void>>()
const preloadedImages = new Map<number, HTMLImageElement>()

const zoomLevel = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)
const lastTouchX = ref(0)
const lastTouchY = ref(0)
const pinchStartDistance = ref(0)
const pinchStartZoom = ref(1)
const isPinching = ref(false)

const carouselPointerId = ref<number | null>(null)
const carouselStartX = ref(0)
const carouselStartY = ref(0)
const carouselDragOffsetX = ref(0)
const isCarouselDragging = ref(false)
const carouselTransitionEnabled = ref(false)
const pendingCarouselDirection = ref<-1 | 0 | 1>(0)
const suppressCarouselTransition = ref(false)
const pendingNavigationDirection = ref<-1 | 0 | 1>(0)
const navigationRequestId = ref(0)
const queuedNavigationDirection = ref<-1 | 0 | 1>(0)

let gestureMediaQuery: MediaQueryList | null = null
let reducedMotionMediaQuery: MediaQueryList | null = null
let visualViewportResizeHandler: (() => void) | null = null
let carouselTransitionTimeoutId: ReturnType<typeof setTimeout> | null = null

const totalPhotos = computed(() => props.photos.length)
const maxZoom = computed(() => (supportsSwipeNavigation.value ? 5 : 4))

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

function getWrappedPhotoIndex(index: number) {
  const total = totalPhotos.value
  if (!total) return 0

  return ((index % total) + total) % total
}

const selectedPhotoIndex = computed({
  get: () => getWrappedPhotoIndex(props.index),
  set: (value: number) => emit('update:index', getWrappedPhotoIndex(value)),
})

function getModalPhoto(index: number) {
  return props.photos[getWrappedPhotoIndex(index)] ?? null
}

function getLightboxPhotoSrc(src: string) {
  return image(src, lightboxImageModifiers)
}

function getPhotoAlt(index: number) {
  return t('events.galleryPhotoAlt', {
    number: getWrappedPhotoIndex(index) + 1,
    event: props.eventTitle,
  })
}

function getActiveModalImage() {
  return imageStageRef.value?.querySelector(
    '[data-slide-active="true"] img'
  ) as HTMLImageElement | null
}

function markPhotoAsLoaded(index: number, image?: HTMLImageElement | null) {
  const normalizedIndex = getWrappedPhotoIndex(index)
  loadedPhotos.add(normalizedIndex)

  if (image?.naturalWidth && image.naturalHeight) {
    preloadedImages.set(normalizedIndex, image)
  }
}

function hasLoadedPhoto(index: number) {
  return loadedPhotos.has(getWrappedPhotoIndex(index))
}

function preloadPhoto(index: number) {
  const normalizedIndex = getWrappedPhotoIndex(index)
  const photo = getModalPhoto(normalizedIndex)

  if (!photo || hasLoadedPhoto(normalizedIndex)) {
    return Promise.resolve()
  }

  const existingPreload = photoPreloads.get(normalizedIndex)
  if (existingPreload) {
    return existingPreload
  }

  if (!import.meta.client) {
    return Promise.resolve()
  }

  const preloadPromise = new Promise<void>((resolve) => {
    const preloadImage = new Image()
    let settled = false

    const finalize = async (loaded: boolean) => {
      if (settled) return
      settled = true

      if (loaded) {
        try {
          await preloadImage.decode()
        } catch {
          // Ignore decode failures and use the already loaded bitmap.
        }

        markPhotoAsLoaded(normalizedIndex, preloadImage)
      }

      photoPreloads.delete(normalizedIndex)
      resolve()
    }

    preloadImage.decoding = 'async'
    preloadImage.onload = () => {
      void finalize(true)
    }
    preloadImage.onerror = () => {
      void finalize(false)
    }
    preloadImage.src = getLightboxPhotoSrc(photo.url)

    if (preloadImage.complete && preloadImage.naturalWidth > 0) {
      void finalize(true)
    }
  })

  photoPreloads.set(normalizedIndex, preloadPromise)
  return preloadPromise
}

function preloadNeighborhood(centerIndex = selectedPhotoIndex.value, radius = 2) {
  if (!totalPhotos.value) return

  for (let offset = -radius; offset <= radius; offset += 1) {
    void preloadPhoto(centerIndex + offset)
  }
}

function updateViewportSize() {
  if (!import.meta.client) return

  viewportWidth.value = Math.round(window.visualViewport?.width ?? window.innerWidth)
  viewportHeight.value = Math.round(window.visualViewport?.height ?? window.innerHeight)
}

function updateSwipeNavigationSupport() {
  supportsSwipeNavigation.value = gestureMediaQuery?.matches ?? false
}

function updateReducedMotionPreference() {
  prefersReducedMotion.value = reducedMotionMediaQuery?.matches ?? false
}

function resetZoom() {
  zoomLevel.value = minZoom
  panX.value = 0
  panY.value = 0
  isPanning.value = false
}

function resetCarouselPointerState() {
  carouselPointerId.value = null
  carouselStartX.value = 0
  carouselStartY.value = 0
  carouselDragOffsetX.value = 0
  isCarouselDragging.value = false
}

function resetTouchState() {
  isPinching.value = false
  pinchStartDistance.value = 0
  pinchStartZoom.value = zoomLevel.value
  lastTouchX.value = 0
  lastTouchY.value = 0
  isPanning.value = false
  resetCarouselPointerState()
}

function resetInteractionState() {
  resetZoom()
  resetTouchState()
  pendingCarouselDirection.value = 0
  carouselTransitionEnabled.value = false
  suppressCarouselTransition.value = false
  pendingNavigationDirection.value = 0
  queuedNavigationDirection.value = 0
  navigationRequestId.value += 1

  if (carouselTransitionTimeoutId) {
    clearTimeout(carouselTransitionTimeoutId)
    carouselTransitionTimeoutId = null
  }
}

function clearPreloads() {
  loadedPhotos.clear()
  photoPreloads.clear()
  preloadedImages.clear()
}

function close() {
  isOpen.value = false
  resetInteractionState()
}

function finalizeCarouselNavigation(direction: -1 | 1) {
  if (carouselTransitionTimeoutId) {
    clearTimeout(carouselTransitionTimeoutId)
    carouselTransitionTimeoutId = null
  }

  const queuedDirection = queuedNavigationDirection.value
  queuedNavigationDirection.value = 0

  selectedPhotoIndex.value = getWrappedPhotoIndex(selectedPhotoIndex.value + direction)
  suppressCarouselTransition.value = true
  pendingCarouselDirection.value = 0
  carouselTransitionEnabled.value = false
  carouselDragOffsetX.value = 0

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      suppressCarouselTransition.value = false

      if (queuedDirection !== 0 && isOpen.value) {
        requestPhotoNavigation(queuedDirection)
      }
    })
  })
}

function handleCarouselTransitionEnd(event: TransitionEvent) {
  if (event.target !== event.currentTarget || event.propertyName !== 'transform') {
    return
  }

  if (pendingCarouselDirection.value === 0) {
    carouselTransitionEnabled.value = false
    return
  }

  finalizeCarouselNavigation(pendingCarouselDirection.value)
}

function isCarouselTransitioning() {
  return carouselTransitionEnabled.value && !suppressCarouselTransition.value
}

function animateCarousel(direction: -1 | 1) {
  if (totalPhotos.value < 2) return

  if (carouselTransitionTimeoutId) {
    clearTimeout(carouselTransitionTimeoutId)
    carouselTransitionTimeoutId = null
  }

  resetZoom()
  resetTouchState()
  carouselTransitionEnabled.value = true
  pendingCarouselDirection.value = direction
  carouselDragOffsetX.value = 0

  const transitionDurationMs = prefersReducedMotion.value ? 20 : 380
  carouselTransitionTimeoutId = setTimeout(() => {
    if (pendingCarouselDirection.value === direction) {
      finalizeCarouselNavigation(direction)
    }
  }, transitionDurationMs)
}

function nextPhoto() {
  requestPhotoNavigation(1)
}

function prevPhoto() {
  requestPhotoNavigation(-1)
}

function requestPhotoNavigation(direction: -1 | 1) {
  if (totalPhotos.value < 2) {
    return
  }

  if (isCarouselTransitioning() || pendingNavigationDirection.value !== 0) {
    queuedNavigationDirection.value = direction
    return
  }

  const targetIndex = getWrappedPhotoIndex(selectedPhotoIndex.value + direction)

  if (hasLoadedPhoto(targetIndex)) {
    animateCarousel(direction)
    return
  }

  pendingNavigationDirection.value = direction
  carouselDragOffsetX.value = 0
  isCarouselDragging.value = false

  const requestId = ++navigationRequestId.value

  preloadPhoto(targetIndex).then(() => {
    if (navigationRequestId.value !== requestId || !isOpen.value) return

    pendingNavigationDirection.value = 0

    if (targetIndex !== getWrappedPhotoIndex(selectedPhotoIndex.value + direction)) return

    animateCarousel(direction)
  })
}

function snapCarouselBack() {
  if (!isCarouselDragging.value && carouselDragOffsetX.value === 0) return

  isCarouselDragging.value = false
  carouselTransitionEnabled.value = true
  pendingCarouselDirection.value = 0
  carouselDragOffsetX.value = 0
}

const selectedPhoto = computed(() => getModalPhoto(selectedPhotoIndex.value))
const selectedPhotoAlt = computed(() => getPhotoAlt(selectedPhotoIndex.value))
const modalPositionLabel = computed(() =>
  t('events.galleryCounter', {
    current: selectedPhotoIndex.value + 1,
    total: totalPhotos.value,
  })
)
const modalDescription = computed(() => modalPositionLabel.value)
const isCurrentPhotoLoading = computed(() => !hasLoadedPhoto(selectedPhotoIndex.value))
const isNavigationLoading = computed(() => pendingNavigationDirection.value !== 0)
const isLightboxLoading = computed(() => isCurrentPhotoLoading.value || isNavigationLoading.value)
const showDesktopChrome = computed(
  () => !supportsSwipeNavigation.value && Boolean(imageStageStyle.value) && !isLightboxLoading.value
)
const showZoomBadge = computed(() => showDesktopChrome.value && zoomLevel.value > minZoom)

const modalSlides = computed(() => {
  if (!selectedPhoto.value || !totalPhotos.value) return []

  return [-1, 0, 1].map((offset) => {
    const index = getWrappedPhotoIndex(selectedPhotoIndex.value + offset)
    const photo = getModalPhoto(index)

    return {
      offset,
      index,
      photo,
      alt: getPhotoAlt(index),
      key: `${selectedPhotoIndex.value}:${offset}:${photo?.url ?? 'empty'}`,
    }
  })
})

const carouselTrackStyle = computed(() => {
  const slideTranslate = 100 / 3
  const baseTranslate =
    pendingCarouselDirection.value === 1
      ? `-${slideTranslate * 2}%`
      : pendingCarouselDirection.value === -1
        ? '0%'
        : `-${slideTranslate}%`

  return {
    transform: `translate3d(calc(${baseTranslate} + ${carouselDragOffsetX.value}px), 0, 0)`,
    transition:
      suppressCarouselTransition.value || !carouselTransitionEnabled.value
        ? 'none'
        : prefersReducedMotion.value
          ? 'transform 0.01ms linear'
          : `transform 360ms ${emphasizedMotionEasing}`,
  }
})

const activeImageStyle = computed(() => ({
  transform: `scale(${zoomLevel.value}) translate(${panX.value / zoomLevel.value}px, ${panY.value / zoomLevel.value}px)`,
}))

const currentAspectRatio = computed<number | null>(() => {
  const normalizedIndex = getWrappedPhotoIndex(selectedPhotoIndex.value)
  if (
    props.initialAspectRatioIndex === normalizedIndex &&
    props.initialAspectRatio &&
    Number.isFinite(props.initialAspectRatio)
  ) {
    return props.initialAspectRatio
  }

  const thumbnailRatio = props.aspectRatios?.[normalizedIndex]
  if (thumbnailRatio && Number.isFinite(thumbnailRatio)) {
    return thumbnailRatio
  }

  const preloadedImage = preloadedImages.get(normalizedIndex)

  if (preloadedImage?.naturalWidth && preloadedImage.naturalHeight) {
    return preloadedImage.naturalWidth / preloadedImage.naturalHeight
  }

  const activeImage = getActiveModalImage()
  if (activeImage?.naturalWidth && activeImage.naturalHeight) {
    return activeImage.naturalWidth / activeImage.naturalHeight
  }

  return null
})

const hasResolvedAspectRatio = computed(() => Boolean(currentAspectRatio.value))

const imageStageStyle = computed(() => {
  if (!currentAspectRatio.value) {
    return null
  }

  const width = viewportWidth.value || 1280
  const height = viewportHeight.value || 720
  const isCompactViewport = width < 768
  const aspectRatio = Math.max(0.42, Math.min(3.2, currentAspectRatio.value))

  const horizontalPadding = isCompactViewport ? 8 : 20
  const verticalPadding = isCompactViewport ? 8 : 12
  const topChrome = isCompactViewport ? 24 : 36
  const bottomChrome = isCompactViewport ? 56 : 48

  const maxStageWidth = Math.max(220, width - horizontalPadding * 2)
  const maxStageHeight = Math.max(260, height - topChrome - bottomChrome - verticalPadding * 2)

  let stageWidth = Math.min(maxStageWidth, maxStageHeight * aspectRatio)
  let stageHeight = stageWidth / aspectRatio

  if (stageHeight > maxStageHeight) {
    stageHeight = maxStageHeight
    stageWidth = stageHeight * aspectRatio
  }

  return {
    width: `${stageWidth}px`,
    height: `${stageHeight}px`,
    maxWidth: '100%',
    maxHeight: '100%',
  }
})

const fallbackImageStageStyle = computed(() => {
  if (imageStageStyle.value) {
    return imageStageStyle.value
  }

  const width = viewportWidth.value || 1280
  const height = viewportHeight.value || 720
  const isCompactViewport = width < 768
  const aspectRatio = Math.max(
    0.55,
    Math.min(2, props.initialAspectRatio || props.aspectRatios?.[selectedPhotoIndex.value] || 1)
  )

  const horizontalPadding = isCompactViewport ? 8 : 20
  const verticalPadding = isCompactViewport ? 8 : 12
  const topChrome = isCompactViewport ? 24 : 36
  const bottomChrome = isCompactViewport ? 56 : 48

  const maxStageWidth = Math.max(220, width - horizontalPadding * 2)
  const maxStageHeight = Math.max(260, height - topChrome - bottomChrome - verticalPadding * 2)

  let stageWidth = Math.min(maxStageWidth, maxStageHeight * aspectRatio)
  let stageHeight = stageWidth / aspectRatio

  if (stageHeight > maxStageHeight) {
    stageHeight = maxStageHeight
    stageWidth = stageHeight * aspectRatio
  }

  return {
    width: `${stageWidth}px`,
    height: `${stageHeight}px`,
    maxWidth: '100%',
    maxHeight: '100%',
  }
})

const activeStageStyle = computed(() => imageStageStyle.value ?? fallbackImageStageStyle.value)

const metaPanelStyle = computed(() => ({
  maxWidth: activeStageStyle.value?.width ?? 'min(100%, 42rem)',
}))

function constrainPan() {
  if (zoomLevel.value <= minZoom) {
    panX.value = 0
    panY.value = 0
    return
  }

  const imageElement = getActiveModalImage()
  const stageRect = imageStageRef.value?.getBoundingClientRect()
  const imageRect = imageElement?.getBoundingClientRect()

  if (!imageRect || !stageRect) return

  const overflowX = Math.max(0, (imageRect.width - stageRect.width) / 2)
  const overflowY = Math.max(0, (imageRect.height - stageRect.height) / 2)

  panX.value = Math.max(-overflowX, Math.min(overflowX, panX.value))
  panY.value = Math.max(-overflowY, Math.min(overflowY, panY.value))
}

function applyZoom(nextZoom: number, origin?: { clientX: number; clientY: number }) {
  const clampedZoom = Math.max(minZoom, Math.min(maxZoom.value, nextZoom))
  if (clampedZoom === zoomLevel.value) return

  const imageElement = origin ? getActiveModalImage() : null

  if (origin && imageElement) {
    const imageRect = imageElement.getBoundingClientRect()
    const imageCenterX = imageRect.left + imageRect.width / 2
    const imageCenterY = imageRect.top + imageRect.height / 2
    const offsetX = origin.clientX - imageCenterX
    const offsetY = origin.clientY - imageCenterY
    const zoomRatio = clampedZoom / zoomLevel.value

    panX.value = panX.value * zoomRatio + offsetX * (1 - zoomRatio)
    panY.value = panY.value * zoomRatio + offsetY * (1 - zoomRatio)
  } else if (clampedZoom < zoomLevel.value) {
    const zoomRatio = clampedZoom / zoomLevel.value
    panX.value *= zoomRatio
    panY.value *= zoomRatio
  }

  zoomLevel.value = clampedZoom

  if (clampedZoom === minZoom) {
    panX.value = 0
    panY.value = 0
  }

  constrainPan()
}

function zoomIn() {
  applyZoom(zoomLevel.value + zoomStep)
}

function zoomOut() {
  applyZoom(zoomLevel.value - zoomStep)
}

function handleWheel(event: WheelEvent) {
  if (!isOpen.value || !imageContainerRef.value || isCarouselTransitioning()) return

  const delta = event.deltaY > 0 ? -zoomStep : zoomStep
  applyZoom(zoomLevel.value + delta, { clientX: event.clientX, clientY: event.clientY })
}

function handleMouseDown(event: MouseEvent) {
  if (zoomLevel.value <= minZoom || isCarouselTransitioning()) return

  isPanning.value = true
  panStartX.value = event.clientX - panX.value
  panStartY.value = event.clientY - panY.value
}

function handleMouseMove(event: MouseEvent) {
  if (!isPanning.value || zoomLevel.value <= minZoom) return

  panX.value = event.clientX - panStartX.value
  panY.value = event.clientY - panStartY.value
  constrainPan()
}

function handleMouseUp() {
  isPanning.value = false
}

function captureCarouselPointer(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (target && !target.hasPointerCapture(event.pointerId)) {
    target.setPointerCapture(event.pointerId)
  }
}

function releaseCarouselPointer(event: PointerEvent) {
  const target = event.currentTarget as HTMLElement | null
  if (target && target.hasPointerCapture(event.pointerId)) {
    target.releasePointerCapture(event.pointerId)
  }
}

function handlePointerDown(event: PointerEvent) {
  if (
    !isOpen.value ||
    !supportsSwipeNavigation.value ||
    zoomLevel.value > minZoom ||
    isCarouselTransitioning() ||
    totalPhotos.value < 2 ||
    carouselPointerId.value !== null
  ) {
    return
  }

  carouselPointerId.value = event.pointerId
  carouselStartX.value = event.clientX
  carouselStartY.value = event.clientY
  carouselDragOffsetX.value = 0
  isCarouselDragging.value = true
  carouselTransitionEnabled.value = false
  pendingCarouselDirection.value = 0
  captureCarouselPointer(event)
}

function handlePointerMove(event: PointerEvent) {
  if (!isOpen.value || carouselPointerId.value !== event.pointerId || !isCarouselDragging.value) {
    return
  }

  captureCarouselPointer(event)
  carouselDragOffsetX.value = event.clientX - carouselStartX.value
}

function handlePointerUp(event: PointerEvent) {
  if (carouselPointerId.value !== event.pointerId) return

  const deltaX = event.clientX - carouselStartX.value
  const deltaY = event.clientY - carouselStartY.value
  const width = imageStageRef.value?.clientWidth ?? imageContainerRef.value?.clientWidth ?? 0
  const threshold = Math.min(140, Math.max(56, width * 0.16))

  releaseCarouselPointer(event)

  if (
    isCarouselDragging.value &&
    Math.abs(deltaX) > threshold &&
    Math.abs(deltaX) > Math.abs(deltaY) * 1.2
  ) {
    carouselPointerId.value = null
    isCarouselDragging.value = false
    requestPhotoNavigation(deltaX < 0 ? 1 : -1)
  } else {
    carouselPointerId.value = null
    snapCarouselBack()
  }
}

function handlePointerCancel(event: PointerEvent) {
  if (carouselPointerId.value === event.pointerId) {
    releaseCarouselPointer(event)
  }

  resetCarouselPointerState()
  pendingCarouselDirection.value = 0
}

function getTouchDistance(touches: TouchList) {
  if (touches.length < 2) return 0
  const firstTouch = touches[0]
  const secondTouch = touches[1]

  if (!firstTouch || !secondTouch) return 0

  return Math.hypot(
    secondTouch.clientX - firstTouch.clientX,
    secondTouch.clientY - firstTouch.clientY
  )
}

function getTouchMidpoint(touches: TouchList) {
  const firstTouch = touches[0]
  const secondTouch = touches[1]

  if (!firstTouch || !secondTouch) {
    return null
  }

  return {
    clientX: (firstTouch.clientX + secondTouch.clientX) / 2,
    clientY: (firstTouch.clientY + secondTouch.clientY) / 2,
  }
}

function handleTouchStart(event: TouchEvent) {
  if (!isOpen.value) return

  if (event.touches.length === 2) {
    resetCarouselPointerState()
    isPinching.value = true
    pinchStartDistance.value = getTouchDistance(event.touches)
    pinchStartZoom.value = zoomLevel.value
    isPanning.value = false
    return
  }

  if (event.touches.length !== 1 || zoomLevel.value <= minZoom) return

  const touch = event.touches[0]
  if (!touch) return

  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
  isPanning.value = true
}

function handleTouchMove(event: TouchEvent) {
  if (!isOpen.value) return

  if (event.touches.length === 2) {
    const distance = getTouchDistance(event.touches)
    const midpoint = getTouchMidpoint(event.touches)

    if (!distance || !pinchStartDistance.value) return

    applyZoom(pinchStartZoom.value * (distance / pinchStartDistance.value), midpoint ?? undefined)
    event.preventDefault()
    return
  }

  if (event.touches.length !== 1 || zoomLevel.value <= minZoom || !isPanning.value) return

  const touch = event.touches[0]
  if (!touch) return

  panX.value += touch.clientX - lastTouchX.value
  panY.value += touch.clientY - lastTouchY.value
  lastTouchX.value = touch.clientX
  lastTouchY.value = touch.clientY
  constrainPan()
  event.preventDefault()
}

function handleTouchEnd(event: TouchEvent) {
  if (!isOpen.value) return

  if (event.touches.length === 2) {
    pinchStartDistance.value = getTouchDistance(event.touches)
    pinchStartZoom.value = zoomLevel.value
    return
  }

  if (event.touches.length === 1) {
    const touch = event.touches[0]
    if (!touch) {
      resetTouchState()
      return
    }

    lastTouchX.value = touch.clientX
    lastTouchY.value = touch.clientY
    isPinching.value = false
    isPanning.value = zoomLevel.value > minZoom
    return
  }

  isPanning.value = false
  isPinching.value = false
}

function handleModalSlideLoad(index: number, event: Event) {
  markPhotoAsLoaded(index, event.target as HTMLImageElement | null)
}

function handleKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return

  if (event.key === 'ArrowRight') nextPhoto()
  if (event.key === 'ArrowLeft') prevPhoto()
  if (event.key === 'Escape') close()

  if (event.key === '+' || event.key === '=') {
    event.preventDefault()
    zoomIn()
  }

  if (event.key === '-') {
    event.preventDefault()
    zoomOut()
  }

  if (event.key === '0') {
    event.preventDefault()
    resetZoom()
  }
}

function onModalOpened() {
  nextTick(() => {
    modalContentRef.value?.focus()
  })
}

watch(
  () => props.photos,
  () => {
    clearPreloads()
    resetInteractionState()

    if (!totalPhotos.value && isOpen.value) {
      close()
      return
    }

    if (props.index !== getWrappedPhotoIndex(props.index)) {
      emit('update:index', getWrappedPhotoIndex(props.index))
    }
  }
)

watch(isOpen, (open) => {
  if (open) {
    preloadNeighborhood()
  } else {
    handleMouseUp()
    resetInteractionState()
  }
})

watch(selectedPhotoIndex, () => {
  preloadNeighborhood()
})

watch(
  () => [viewportWidth.value, viewportHeight.value, selectedPhotoIndex.value],
  () => {
    if (zoomLevel.value > minZoom) {
      nextTick(() => {
        constrainPan()
      })
    }
  }
)

onMounted(() => {
  updateViewportSize()

  gestureMediaQuery = window.matchMedia('(max-width: 767px), (pointer: coarse)')
  reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

  updateSwipeNavigationSupport()
  updateReducedMotionPreference()

  gestureMediaQuery.addEventListener('change', updateSwipeNavigationSupport)
  reducedMotionMediaQuery.addEventListener('change', updateReducedMotionPreference)

  window.addEventListener('resize', updateViewportSize)
  window.addEventListener('keydown', handleKeydown)

  visualViewportResizeHandler = () => updateViewportSize()
  window.visualViewport?.addEventListener('resize', visualViewportResizeHandler)
  window.visualViewport?.addEventListener('scroll', visualViewportResizeHandler)
})

onUnmounted(() => {
  if (carouselTransitionTimeoutId) {
    clearTimeout(carouselTransitionTimeoutId)
  }

  gestureMediaQuery?.removeEventListener('change', updateSwipeNavigationSupport)
  reducedMotionMediaQuery?.removeEventListener('change', updateReducedMotionPreference)
  window.removeEventListener('resize', updateViewportSize)
  window.removeEventListener('keydown', handleKeydown)

  if (visualViewportResizeHandler) {
    window.visualViewport?.removeEventListener('resize', visualViewportResizeHandler)
    window.visualViewport?.removeEventListener('scroll', visualViewportResizeHandler)
  }
})
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="selectedPhotoAlt || t('events.gallery')"
    :description="modalDescription"
    :aria-label="selectedPhotoAlt || t('events.gallery')"
    :transition="false"
    :ui="{
      overlay:
        'bg-black/24 backdrop-blur-sm data-[state=open]:animate-[fade-in_180ms_ease-out] data-[state=closed]:animate-[fade-out_120ms_ease-in]',
      content:
        'w-[calc(100vw-0.5rem)] max-w-384 overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 data-[state=open]:animate-[scale-in_180ms_ease-out] data-[state=closed]:animate-[scale-out_120ms_ease-in] md:w-[calc(100vw-1.5rem)]',
    }"
    @after-enter="onModalOpened"
  >
    <template #content>
      <div
        v-if="selectedPhoto"
        ref="modalContentRef"
        class="relative flex max-h-[96vh] flex-col overflow-visible"
        tabindex="-1"
      >
        <div
          ref="imageContainerRef"
          class="relative flex min-h-[58vw] flex-1 touch-none items-center justify-center overflow-visible md:min-h-0"
          @wheel.prevent="handleWheel"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
          @mouseleave="handleMouseUp"
          @pointerdown="handlePointerDown"
          @pointermove="handlePointerMove"
          @pointerup="handlePointerUp"
          @pointercancel="handlePointerCancel"
          @touchstart="handleTouchStart"
          @touchmove="handleTouchMove"
          @touchend="handleTouchEnd"
          @touchcancel="handleTouchEnd"
        >
          <button
            v-if="!supportsSwipeNavigation"
            type="button"
            class="absolute inset-0 z-0 block bg-transparent"
            :aria-label="t('events.galleryClose')"
            @click="close"
          />

          <div
            v-if="activeStageStyle"
            class="gallery-lightbox-frame relative z-10"
            :style="activeStageStyle"
            :aria-busy="isCurrentPhotoLoading"
            @click.stop
          >
            <div
              v-if="!hasResolvedAspectRatio"
              class="gallery-lightbox-loading-shell h-full w-full rounded-[1rem] md:rounded-[1.2rem]"
            >
              <div class="gallery-lightbox-loading-overlay">
                <div class="gallery-lightbox-loading-pill" role="status" aria-live="polite">
                  <span class="gallery-lightbox-spinner animate-spin" aria-hidden="true" />
                  <span>{{ t('events.galleryLoading') }}</span>
                </div>
              </div>
            </div>

            <div
              v-else
              ref="imageStageRef"
              class="gallery-lightbox-stage relative h-full w-full overflow-hidden rounded-[1rem] border border-white/8 shadow-[0_24px_64px_rgb(15_23_42/0.36)] md:rounded-[1.2rem]"
            >
              <div
                class="gallery-lightbox-loading-surface absolute inset-0 z-0 transition-opacity duration-150"
                :class="isCurrentPhotoLoading ? 'opacity-100' : 'opacity-0'"
                aria-hidden="true"
              />

              <div
                class="gallery-lightbox-track relative z-10 flex h-full w-[300%]"
                :style="carouselTrackStyle"
                @transitionend="handleCarouselTransitionEnd"
              >
                <div
                  v-for="slide in modalSlides"
                  :key="slide.key"
                  class="flex h-full w-1/3 shrink-0 items-center justify-center"
                  :data-slide-active="slide.offset === 0 ? 'true' : 'false'"
                >
                  <NuxtImg
                    v-if="slide.photo"
                    :src="slide.photo.url"
                    :alt="slide.alt"
                    class="block h-full w-full object-contain object-center select-none"
                    :class="{
                      'cursor-grab': slide.offset === 0 && zoomLevel > minZoom && !isPanning,
                      'cursor-grabbing': slide.offset === 0 && isPanning,
                      'pointer-events-none': slide.offset !== 0,
                      'opacity-0':
                        slide.offset === 0 && isCurrentPhotoLoading && !hasLoadedPhoto(slide.index),
                      'gallery-lightbox-image': slide.offset === 0,
                    }"
                    :style="slide.offset === 0 ? activeImageStyle : undefined"
                    :width="lightboxImageWidth"
                    :quality="lightboxImageQuality"
                    :format="lightboxImageFormat"
                    decoding="async"
                    :loading="slide.offset === 0 ? 'eager' : 'lazy'"
                    :fetchpriority="slide.offset === 0 ? 'high' : 'low'"
                    @load="handleModalSlideLoad(slide.index, $event)"
                    @dragstart.prevent="() => undefined"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              class="gallery-lightbox-chrome gallery-lightbox-close-button gallery-lightbox-dismiss focus-visible:ring-primary absolute z-20 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              :aria-label="t('events.galleryClose')"
              @pointerdown.stop
              @pointerup.stop
              @mousedown.stop
              @touchstart.stop
              @click.stop="close"
            >
              <UIcon name="i-tabler-x" class="size-6" />
            </button>

            <div
              v-if="showZoomBadge"
              class="gallery-lightbox-chrome gallery-lightbox-badge absolute top-4 left-4 z-20 hidden md:flex"
            >
              {{ Math.round(zoomLevel * 100) }}%
            </div>

            <div
              v-if="hasResolvedAspectRatio && isLightboxLoading"
              class="absolute inset-0 z-10 flex items-center justify-center rounded-[1rem] bg-black/58 backdrop-blur-[2px] md:rounded-[1.2rem]"
            >
              <div class="gallery-lightbox-loading-pill" role="status" aria-live="polite">
                <span class="gallery-lightbox-spinner animate-spin" aria-hidden="true" />
                <span>{{ t('events.galleryLoading') }}</span>
              </div>
            </div>

            <button
              v-if="totalPhotos > 1 && showDesktopChrome"
              type="button"
              class="gallery-lightbox-chrome gallery-lightbox-nav left-4 hidden md:flex"
              :aria-label="t('events.galleryPrevious')"
              @pointerdown.stop
              @pointerup.stop
              @mousedown.stop
              @click.stop="prevPhoto"
            >
              <UIcon name="i-tabler-chevron-left" class="size-7" />
            </button>

            <button
              v-if="totalPhotos > 1 && showDesktopChrome"
              type="button"
              class="gallery-lightbox-chrome gallery-lightbox-nav right-4 hidden md:flex"
              :aria-label="t('events.galleryNext')"
              @pointerdown.stop
              @pointerup.stop
              @mousedown.stop
              @click.stop="nextPhoto"
            >
              <UIcon name="i-tabler-chevron-right" class="size-7" />
            </button>

            <div
              v-if="showDesktopChrome"
              class="gallery-lightbox-chrome absolute top-4 left-1/2 z-20 hidden -translate-x-1/2 gap-2 md:flex"
              @click.stop
            >
              <button
                type="button"
                class="gallery-lightbox-control"
                :disabled="zoomLevel <= minZoom"
                :aria-label="t('events.galleryZoomOut')"
                @pointerdown.stop
                @pointerup.stop
                @mousedown.stop
                @click.stop="zoomOut"
              >
                <UIcon name="i-tabler-zoom-out" class="size-5" />
              </button>
              <button
                type="button"
                class="gallery-lightbox-control"
                :aria-label="t('events.galleryResetZoom')"
                @pointerdown.stop
                @pointerup.stop
                @mousedown.stop
                @click.stop="resetZoom"
              >
                <UIcon name="i-tabler-zoom-reset" class="size-5" />
              </button>
              <button
                type="button"
                class="gallery-lightbox-control"
                :disabled="zoomLevel >= maxZoom"
                :aria-label="t('events.galleryZoomIn')"
                @pointerdown.stop
                @pointerup.stop
                @mousedown.stop
                @click.stop="zoomIn"
              >
                <UIcon name="i-tabler-zoom-in" class="size-5" />
              </button>
            </div>
          </div>
        </div>

        <div
          v-if="totalPhotos"
          class="relative mt-3 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:px-0 md:pb-0"
        >
          <button
            v-if="!supportsSwipeNavigation"
            type="button"
            class="absolute inset-0 z-0 block bg-transparent"
            :aria-label="t('events.galleryClose')"
            @click="close"
          />

          <div
            class="relative z-10 mx-auto flex w-full max-w-full flex-col items-center rounded-[1.1rem] border border-white/55 bg-white/96 px-4 py-3 text-center text-[rgb(15_23_42)] shadow-[0_12px_40px_rgb(15_23_42/0.16)] md:w-fit"
            :style="metaPanelStyle"
            @click.stop
          >
            <div
              v-if="totalPhotos > 1"
              class="mb-3 flex w-full items-center justify-center gap-3 md:hidden"
            >
              <button
                type="button"
                class="gallery-lightbox-meta-nav focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                :aria-label="t('events.galleryPrevious')"
                @click.stop="prevPhoto"
              >
                <UIcon name="i-tabler-chevron-left" class="size-5" />
              </button>

              <div
                class="w-fit rounded-full bg-black/6 px-3 py-1.5 text-xs font-medium text-[rgb(51_65_85)]"
                aria-live="polite"
              >
                {{ modalPositionLabel }}
              </div>

              <button
                type="button"
                class="gallery-lightbox-meta-nav focus-visible:ring-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
                :aria-label="t('events.galleryNext')"
                @click.stop="nextPhoto"
              >
                <UIcon name="i-tabler-chevron-right" class="size-5" />
              </button>
            </div>

            <div
              class="mb-2 hidden w-fit rounded-full bg-black/6 px-3 py-1.5 text-xs font-medium text-[rgb(51_65_85)] md:block"
              aria-live="polite"
            >
              {{ modalPositionLabel }}
            </div>
            <p class="max-w-full text-sm font-semibold md:text-base">{{ selectedPhotoAlt }}</p>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.gallery-lightbox-frame {
  transition:
    width 360ms cubic-bezier(0.16, 1, 0.3, 1),
    height 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-lightbox-stage {
  background:
    radial-gradient(circle at top, rgb(255 255 255 / 0.05), transparent 48%),
    linear-gradient(180deg, rgb(15 23 42 / 0.12), rgb(15 23 42 / 0.18));
}

.gallery-lightbox-track {
  will-change: transform;
  backface-visibility: hidden;
}

.gallery-lightbox-loading-shell {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgb(15 23 42 / 0.82), rgb(30 41 59 / 0.72)),
    linear-gradient(90deg, rgb(255 255 255 / 0.05), rgb(255 255 255 / 0.08));
  box-shadow: 0 20px 60px rgb(15 23 42 / 0.28);
}

.gallery-lightbox-loading-surface {
  background:
    linear-gradient(135deg, rgb(15 23 42 / 0.84), rgb(30 41 59 / 0.72)),
    linear-gradient(90deg, rgb(255 255 255 / 0.03), rgb(255 255 255 / 0.08));
}

.gallery-lightbox-loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
}

.gallery-lightbox-loading-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 9999px;
  background: rgb(0 0 0 / 0.72);
  padding: 0.625rem 1rem;
  color: white;
  line-height: 1;
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.28);
}

.gallery-lightbox-spinner {
  display: block;
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
  border: 2px solid rgb(255 255 255 / 0.28);
  border-top-color: rgb(255 255 255);
  border-radius: 9999px;
}

.gallery-lightbox-image {
  transition:
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 140ms ease;
  will-change: transform;
}

.gallery-lightbox-chrome {
  visibility: hidden;
  opacity: 0;
  transform: translateY(0.35rem);
  pointer-events: none;
  transition:
    visibility 0s linear 180ms,
    opacity 180ms ease,
    transform 180ms ease;
}

.gallery-lightbox-frame:hover .gallery-lightbox-chrome,
.gallery-lightbox-frame:focus-within .gallery-lightbox-chrome {
  visibility: visible;
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  transition-delay: 0s;
}

.gallery-lightbox-badge,
.gallery-lightbox-control,
.gallery-lightbox-nav,
.gallery-lightbox-close-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(0 0 0 / 0.5);
  color: white;
}

.gallery-lightbox-badge {
  padding: 0.5rem 0.8rem;
  font-size: 0.95rem;
  font-weight: 600;
  line-height: 1;
}

.gallery-lightbox-control {
  width: 2.5rem;
  height: 2.5rem;
}

.gallery-lightbox-close-button {
  width: 3rem;
  height: 3rem;
}

.gallery-lightbox-dismiss {
  top: 0.75rem;
  right: 0.75rem;
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.24);
  backdrop-filter: blur(10px);
}

.gallery-lightbox-nav {
  position: absolute;
  top: 50%;
  z-index: 15;
  width: 3.25rem;
  height: 3.25rem;
  transform: translateY(-50%);
}

.gallery-lightbox-control:hover,
.gallery-lightbox-nav:hover,
.gallery-lightbox-close-button:hover {
  background: rgb(0 0 0 / 0.7);
}

.gallery-lightbox-control:disabled {
  opacity: 0.42;
}

.gallery-lightbox-meta-nav {
  display: inline-flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(15 23 42 / 0.08);
  color: rgb(15 23 42);
}

.gallery-lightbox-meta-nav:hover {
  background: rgb(15 23 42 / 0.14);
}

@media (max-width: 767px) {
  .gallery-lightbox-dismiss {
    visibility: visible;
    opacity: 1;
    transform: none;
    pointer-events: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .gallery-lightbox-stage,
  .gallery-lightbox-frame,
  .gallery-lightbox-image,
  .gallery-lightbox-chrome {
    transition: none;
  }
}
</style>
