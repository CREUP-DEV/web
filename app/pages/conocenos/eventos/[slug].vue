<script setup lang="ts">
/**
 * Event Detail Page
 * Displays full information for a single event, including banner,
 * documents, organizers, venues, and collaborators.
 */

import type { EventOrganization } from '~/composables/useEvents'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const slug = computed(() => String(route.params.slug))
const { formatDate: formatLocaleDate } = useLocaleFormatting()

// ============================================================================
// Data fetching
// ============================================================================

const { events, error, status } = useEvents()

const event = computed(() => events.value.find((e) => e.slug === slug.value) ?? null)

// ============================================================================
// SEO
// ============================================================================

useSeoMeta({
  title: () => event.value?.name ?? t('events.title'),
  description: () => event.value?.description ?? t('events.description'),
  ogTitle: () => event.value?.name ?? t('events.title'),
  ogDescription: () => event.value?.description ?? t('events.description'),
  ogImage: () => event.value?.banner.url ?? undefined,
})

// ============================================================================
// Date helpers
// ============================================================================

const formatShortDate = (dateStr: string): string => {
  return formatLocaleDate(`${dateStr}T00:00:00`, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const formatDateRange = computed(() => {
  if (!event.value) return ''
  const startStr = formatShortDate(event.value.startDate)
  if (!event.value.endDate) return startStr
  return `${startStr} — ${formatShortDate(event.value.endDate)}`
})

const isUpcoming = computed(() => {
  if (!event.value) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const endDate = event.value.endDate
    ? new Date(event.value.endDate + 'T00:00:00')
    : new Date(event.value.startDate + 'T00:00:00')
  return endDate >= now
})

const isOngoing = computed(() => {
  if (!event.value) return false
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(event.value.startDate + 'T00:00:00')
  const end = event.value.endDate
    ? new Date(event.value.endDate + 'T00:00:00')
    : new Date(event.value.startDate + 'T00:00:00')
  return start <= now && now <= end
})

// ============================================================================
// Helpers
// ============================================================================

const hasOrganizations = (orgs: EventOrganization[]) => orgs.length > 0 && orgs.some((o) => o.name)

const normalizeUrl = (url: string | null): string | undefined => {
  if (!url) return undefined
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

// ============================================================================
// Gallery lightbox
// ============================================================================

const galleryImages = computed(() => (event.value?.galleryImages ?? []).filter((img) => img.url))

const isLightboxOpen = ref(false)
const lightboxIndex = ref(0)
const isLightboxImageLoading = ref(false)

const lightboxPhoto = computed(() => galleryImages.value[lightboxIndex.value] ?? null)

function openLightbox(index: number) {
  lightboxIndex.value = index
  isLightboxImageLoading.value = true
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
  isLightboxOpen.value = true
  touchControlsVisible.value = true
}

function closeLightbox() {
  isLightboxOpen.value = false
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function lightboxPrev() {
  if (galleryImages.value.length === 0) return
  lightboxIndex.value =
    lightboxIndex.value === 0 ? galleryImages.value.length - 1 : lightboxIndex.value - 1
  isLightboxImageLoading.value = true
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function lightboxNext() {
  if (galleryImages.value.length === 0) return
  lightboxIndex.value = (lightboxIndex.value + 1) % galleryImages.value.length
  isLightboxImageLoading.value = true
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function onLightboxImageLoad() {
  isLightboxImageLoading.value = false
}

function getPhotoAlt(index: number): string {
  return t('events.galleryPhotoAlt', { number: index + 1, event: event.value?.name ?? '' })
}

// ============================================================================
// Touch device detection
// ============================================================================

const isTouchDevice = ref(false)
const touchControlsVisible = ref(true)

const showZoomControls = computed(() => !isTouchDevice.value)
const showOverlayControls = computed(() => !isTouchDevice.value || touchControlsVisible.value)

// ============================================================================
// Zoom & pan
// ============================================================================

const zoomLevel = ref(1)
const minZoom = 1
const maxZoom = 3
const zoomStep = 0.2

const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const panStartX = ref(0)
const panStartY = ref(0)
const imageContainerRef = ref<HTMLElement | null>(null)

function constrainPan() {
  if (zoomLevel.value <= 1) {
    panX.value = 0
    panY.value = 0
    return
  }

  const imgElement = imageContainerRef.value?.querySelector('img')
  if (!imgElement || !imageContainerRef.value) return

  const imgRect = imgElement.getBoundingClientRect()
  const containerRect = imageContainerRef.value.getBoundingClientRect()

  const overflowX = Math.max(0, (imgRect.width - containerRect.width) / 2)
  const overflowY = Math.max(0, (imgRect.height - containerRect.height) / 2)

  panX.value = Math.max(-overflowX, Math.min(overflowX, panX.value))
  panY.value = Math.max(-overflowY, Math.min(overflowY, panY.value))
}

function handleWheel(e: WheelEvent) {
  if (!isLightboxOpen.value || !imageContainerRef.value) return

  const delta = e.deltaY > 0 ? -zoomStep : zoomStep
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta))

  if (newZoom !== zoomLevel.value) {
    if (newZoom < zoomLevel.value) {
      const zoomRatio = newZoom / zoomLevel.value
      panX.value *= zoomRatio
      panY.value *= zoomRatio
      if (newZoom === minZoom) {
        panX.value = 0
        panY.value = 0
      }
    } else {
      const imgElement = imageContainerRef.value.querySelector('img')
      if (imgElement) {
        const imgRect = imgElement.getBoundingClientRect()
        const imgCenterX = imgRect.left + imgRect.width / 2
        const imgCenterY = imgRect.top + imgRect.height / 2
        const offsetX = e.clientX - imgCenterX
        const offsetY = e.clientY - imgCenterY
        const zoomRatio = newZoom / zoomLevel.value
        panX.value = panX.value * zoomRatio + offsetX * (1 - zoomRatio)
        panY.value = panY.value * zoomRatio + offsetY * (1 - zoomRatio)
      }
    }
    zoomLevel.value = newZoom
    constrainPan()
  }
}

function resetZoom() {
  zoomLevel.value = 1
  panX.value = 0
  panY.value = 0
}

function zoomIn() {
  const newZoom = Math.min(maxZoom, zoomLevel.value + zoomStep)
  if (newZoom !== zoomLevel.value) {
    zoomLevel.value = newZoom
    constrainPan()
  }
}

function zoomOut() {
  const newZoom = Math.max(minZoom, zoomLevel.value - zoomStep)
  if (newZoom !== zoomLevel.value) {
    const zoomRatio = newZoom / zoomLevel.value
    panX.value *= zoomRatio
    panY.value *= zoomRatio
    if (newZoom === minZoom) {
      panX.value = 0
      panY.value = 0
    }
    zoomLevel.value = newZoom
    constrainPan()
  }
}

function handleMouseDown(e: MouseEvent) {
  if (zoomLevel.value <= 1) return
  isPanning.value = true
  panStartX.value = e.clientX - panX.value
  panStartY.value = e.clientY - panY.value
}

function handleMouseMove(e: MouseEvent) {
  if (!isPanning.value || zoomLevel.value <= 1) return
  panX.value = e.clientX - panStartX.value
  panY.value = e.clientY - panStartY.value
  constrainPan()
}

function handleMouseUp() {
  isPanning.value = false
}

function handleModalTap() {
  if (!isTouchDevice.value) return
  touchControlsVisible.value = !touchControlsVisible.value
}

// ============================================================================
// Focus management
// ============================================================================

const modalContentRef = ref<HTMLElement | null>(null)

function onModalOpened() {
  nextTick(() => {
    modalContentRef.value?.focus()
  })
}

// ============================================================================
// Keyboard shortcuts
// ============================================================================

function handleLightboxKeydown(e: KeyboardEvent) {
  if (!isLightboxOpen.value) return
  if (e.key === 'ArrowRight') lightboxNext()
  if (e.key === 'ArrowLeft') lightboxPrev()
  if (e.key === 'Escape') closeLightbox()
  if (e.key === '+' || e.key === '=') {
    e.preventDefault()
    zoomIn()
  }
  if (e.key === '-') {
    e.preventDefault()
    zoomOut()
  }
  if (e.key === '0') {
    e.preventDefault()
    resetZoom()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleLightboxKeydown)
  isTouchDevice.value = 'ontouchstart' in window || window.navigator.maxTouchPoints > 0
})
onUnmounted(() => window.removeEventListener('keydown', handleLightboxKeydown))
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="mx-auto max-w-4xl">
      <!-- Back navigation -->
      <UButton
        :to="localePath('/conocenos/eventos')"
        variant="ghost"
        icon="i-tabler-arrow-left"
        :label="t('events.backToEvents')"
        class="mb-6"
      />

      <!-- Error state -->
      <UAlert
        v-if="error"
        color="error"
        icon="i-tabler-alert-circle"
        :title="t('events.loadError')"
      />

      <!-- Loading state -->
      <div
        v-else-if="status === 'pending'"
        class="flex justify-center py-12"
        :aria-label="t('accessibility.loading')"
      >
        <UIcon name="i-tabler-loader-2" class="text-muted size-8 animate-spin" />
      </div>

      <!-- Not found -->
      <UAlert
        v-else-if="!event"
        color="warning"
        icon="i-tabler-alert-triangle"
        :title="t('events.notFound')"
      />

      <!-- Event detail -->
      <article v-else class="space-y-8">
        <!-- Banner -->
        <div v-if="event.banner.url" class="overflow-hidden rounded-lg">
          <NuxtImg
            :src="event.banner.url"
            :alt="t('events.bannerAlt', { event: event.name })"
            class="aspect-7/2 w-full object-cover"
            loading="eager"
            width="896"
            height="256"
          />
        </div>

        <!-- Header -->
        <header class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge v-if="isOngoing" color="success" variant="soft">
              {{ t('events.ongoing') }}
            </UBadge>
            <UBadge v-else-if="isUpcoming" color="info" variant="soft">
              {{ t('events.upcoming') }}
            </UBadge>
            <UBadge v-if="event.type" color="neutral" variant="soft">
              {{ event.type }}
            </UBadge>
          </div>

          <h1 class="text-3xl font-bold sm:text-4xl">
            {{ event.name }}
          </h1>

          <div class="text-muted flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <span>
              <UIcon name="i-tabler-calendar" class="mr-1 inline-block size-4 align-text-bottom" />
              {{ formatDateRange }}
            </span>
            <span v-if="event.location">
              <UIcon name="i-tabler-map-pin" class="mr-1 inline-block size-4 align-text-bottom" />
              {{ event.location }}
            </span>
          </div>
        </header>

        <!-- Description -->
        <UCard v-if="event.description">
          <p class="leading-relaxed">{{ event.description }}</p>
        </UCard>

        <!-- Documents -->
        <section v-if="event.documents.length > 0" aria-labelledby="event-documents">
          <h2 id="event-documents" class="mb-4 text-xl font-semibold">
            {{ t('events.documents') }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <UButton
              v-for="doc in event.documents"
              :key="doc.order"
              :href="doc.url ?? undefined"
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="soft"
              color="primary"
              icon="i-tabler-file-download"
              :label="doc.title ?? t('events.document')"
              :disabled="!doc.url"
            />
          </div>
        </section>

        <!-- Organizers -->
        <section v-if="hasOrganizations(event.organizers)" aria-labelledby="event-organizers">
          <h2 id="event-organizers" class="mb-4 text-xl font-semibold">
            {{ t('events.organizers', event.organizers.filter((o) => o.name).length) }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard v-for="org in event.organizers" :key="org.order" class="text-center">
              <div class="flex flex-col items-center gap-3">
                <NuxtImg
                  v-if="org.logoLight"
                  :src="org.logoLight"
                  :alt="org.name ?? ''"
                  class="h-12 w-auto object-contain"
                  loading="lazy"
                />
                <p class="text-sm font-medium">{{ org.name }}</p>
                <UButton
                  v-if="org.link"
                  :to="normalizeUrl(org.link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="xs"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

        <!-- Venues -->
        <section v-if="hasOrganizations(event.venues)" aria-labelledby="event-venues">
          <h2 id="event-venues" class="mb-4 text-xl font-semibold">
            {{ t('events.venues', event.venues.filter((o) => o.name).length) }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard v-for="venue in event.venues" :key="venue.order" class="text-center">
              <div class="flex flex-col items-center gap-3">
                <NuxtImg
                  v-if="venue.logoLight"
                  :src="venue.logoLight"
                  :alt="venue.name ?? ''"
                  class="h-12 w-auto object-contain"
                  loading="lazy"
                />
                <p class="text-sm font-medium">{{ venue.name }}</p>
                <UButton
                  v-if="venue.link"
                  :to="normalizeUrl(venue.link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="xs"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

        <!-- Collaborators -->
        <section v-if="hasOrganizations(event.collaborators)" aria-labelledby="event-collaborators">
          <h2 id="event-collaborators" class="mb-4 text-xl font-semibold">
            {{ t('events.collaborators', event.collaborators.filter((o) => o.name).length) }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <UCard v-for="collab in event.collaborators" :key="collab.order" class="text-center">
              <div class="flex flex-col items-center gap-3">
                <NuxtImg
                  v-if="collab.logoLight"
                  :src="collab.logoLight"
                  :alt="collab.name ?? ''"
                  class="h-12 w-auto object-contain"
                  loading="lazy"
                />
                <p class="text-sm font-medium">{{ collab.name }}</p>
                <UButton
                  v-if="collab.link"
                  :to="normalizeUrl(collab.link)"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="xs"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

        <!-- Gallery -->
        <section v-if="galleryImages.length > 0" aria-labelledby="event-gallery">
          <h2 id="event-gallery" class="mb-4 text-xl font-semibold">
            {{ t('events.gallery') }}
          </h2>
          <div
            role="list"
            :aria-label="t('events.gallery')"
            class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
          >
            <button
              v-for="(img, index) in galleryImages"
              :key="img.order"
              type="button"
              role="listitem"
              :aria-label="getPhotoAlt(index)"
              class="focus-visible:ring-primary bg-muted group relative aspect-square cursor-pointer overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              @click="openLightbox(index)"
            >
              <NuxtImg
                :src="img.url!"
                :alt="getPhotoAlt(index)"
                class="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                loading="lazy"
                width="300"
                height="300"
              />
              <div
                class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/40"
              >
                <UIcon
                  name="i-tabler-zoom-in"
                  class="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
            </button>
          </div>
        </section>
      </article>

      <!-- Lightbox modal -->
      <UModal
        v-model:open="isLightboxOpen"
        :ui="{ content: 'max-w-[95vw] max-h-[95vh]' }"
        @after-enter="onModalOpened"
      >
        <template #content>
          <div ref="modalContentRef" class="relative" tabindex="-1">
            <!-- Image container with zoom/pan -->
            <div
              ref="imageContainerRef"
              class="relative flex items-center justify-center overflow-hidden bg-black/90"
              style="max-height: 80vh"
              @wheel.prevent="handleWheel"
              @mousedown="handleMouseDown"
              @mousemove="handleMouseMove"
              @mouseup="handleMouseUp"
              @mouseleave="handleMouseUp"
              @click="handleModalTap"
            >
              <!-- Loading spinner -->
              <div
                v-if="isLightboxImageLoading"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/80"
              >
                <div class="flex flex-col items-center gap-4">
                  <UIcon name="i-tabler-loader-2" class="size-12 animate-spin text-white" />
                  <span class="text-sm text-white/70">{{ t('events.galleryLoading') }}</span>
                </div>
              </div>

              <!-- Image with zoom -->
              <NuxtImg
                v-if="lightboxPhoto?.url"
                :key="lightboxIndex"
                :src="lightboxPhoto.url"
                :alt="getPhotoAlt(lightboxIndex)"
                class="max-h-[80vh] max-w-full object-contain select-none"
                :class="{
                  'cursor-grab': zoomLevel > 1 && !isPanning,
                  'cursor-grabbing': isPanning,
                  'transition-transform duration-200': !isPanning,
                }"
                :style="{
                  transform: `scale(${zoomLevel}) translate(${panX / zoomLevel}px, ${panY / zoomLevel}px)`,
                }"
                width="1920"
                height="1080"
                @load="onLightboxImageLoad"
                @dragstart.prevent
              />
            </div>

            <!-- Zoom indicator -->
            <div
              v-if="zoomLevel > 1"
              class="absolute top-4 left-4 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white"
            >
              {{ Math.round(zoomLevel * 100) }}%
            </div>

            <!-- Zoom controls -->
            <div
              v-if="showZoomControls"
              class="absolute top-4 left-1/2 flex -translate-x-1/2 gap-2"
            >
              <button
                type="button"
                class="flex items-center justify-center rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none disabled:opacity-50"
                :disabled="zoomLevel <= minZoom"
                :aria-label="t('events.galleryZoomOut')"
                @click.stop="zoomOut"
              >
                <UIcon name="i-tabler-zoom-out" class="size-5" />
              </button>
              <button
                type="button"
                class="flex items-center justify-center rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
                :aria-label="t('events.galleryResetZoom')"
                @click.stop="resetZoom"
              >
                <UIcon name="i-tabler-zoom-reset" class="size-5" />
              </button>
              <button
                type="button"
                class="flex items-center justify-center rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none disabled:opacity-50"
                :disabled="zoomLevel >= maxZoom"
                :aria-label="t('events.galleryZoomIn')"
                @click.stop="zoomIn"
              >
                <UIcon name="i-tabler-zoom-in" class="size-5" />
              </button>
            </div>

            <!-- Previous button -->
            <button
              v-if="showOverlayControls && galleryImages.length > 1"
              type="button"
              class="absolute top-1/2 left-4 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
              :aria-label="t('events.galleryPrevious')"
              @click.stop="lightboxPrev"
            >
              <UIcon name="i-tabler-chevron-left" class="size-8" />
            </button>

            <!-- Next button -->
            <button
              v-if="showOverlayControls && galleryImages.length > 1"
              type="button"
              class="absolute top-1/2 right-4 flex -translate-y-1/2 items-center justify-center rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
              :aria-label="t('events.galleryNext')"
              @click.stop="lightboxNext"
            >
              <UIcon name="i-tabler-chevron-right" class="size-8" />
            </button>

            <!-- Close button -->
            <button
              v-if="showOverlayControls"
              type="button"
              class="absolute top-4 right-4 flex items-center justify-center rounded-full bg-black/50 p-3 text-white transition-colors hover:bg-black/70 focus:ring-2 focus:ring-white focus:outline-none"
              :aria-label="t('events.galleryClose')"
              @click.stop="closeLightbox"
            >
              <UIcon name="i-tabler-x" class="size-6" />
            </button>

            <!-- Counter -->
            <div
              v-if="showOverlayControls && galleryImages.length > 1"
              class="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-4 py-2 text-white"
              aria-live="polite"
            >
              {{
                t('events.galleryCounter', {
                  current: lightboxIndex + 1,
                  total: galleryImages.length,
                })
              }}
            </div>
          </div>
        </template>
      </UModal>
    </div>
  </UContainer>
</template>
