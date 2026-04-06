<script setup lang="ts">
import type { CREUPEvent, EventGalleryImage, EventOrganization } from '~/composables/useEvents'
import { normalizeHostname, normalizeUrl } from '~~/shared/utils/url'

type EventGalleryImageWithUrl = EventGalleryImage & {
  url: string
}

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const siteConfig = useSiteConfig()
const slug = computed(() => String(route.params.slug))
const {
  formatDateRange: formatDateRangeText,
  isDateRangeOngoing,
  isDateRangeUpcoming,
} = useDatePresets()

const { data, error } = await useEvent(slug)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode === 404 ? 404 : 503,
    fatal: true,
    message: error.value.statusCode === 404 ? t('events.notFound') : t('error.message'),
  })
}

const eventData = data.value?.event

if (!eventData) {
  throw createError({
    statusCode: 404,
    fatal: true,
    message: t('events.notFound'),
  })
}

const event = computed<CREUPEvent>(() => {
  const currentEvent = data.value?.event

  if (!currentEvent) {
    throw createError({
      statusCode: 404,
      fatal: true,
      message: t('events.notFound'),
    })
  }

  return currentEvent
})

usePageSeo(
  () => event.value.name ?? t('events.title'),
  () => event.value.description ?? t('events.description'),
  {
    ogImage: () => event.value.banner.url ?? undefined,
    ogType: () => 'article',
  }
)

const formatDateRange = computed(() => {
  return formatDateRangeText(event.value.startDate, event.value.endDate, {
    includeYear: true,
  })
})

const isUpcoming = computed(() => {
  return isDateRangeUpcoming(event.value.startDate, event.value.endDate)
})

const isOngoing = computed(() => {
  return isDateRangeOngoing(event.value.startDate, event.value.endDate)
})

const hasOrganizations = (orgs: EventOrganization[]) => orgs.length > 0 && orgs.some((o) => o.name)

const configuredSiteHostname = computed<string | null>(() => {
  const configuredSiteUrl = normalizeUrl(String(siteConfig.url ?? '').trim() || null)
  if (!configuredSiteUrl) return null

  try {
    return normalizeHostname(new URL(configuredSiteUrl).hostname)
  } catch {
    return null
  }
})

const isExternalToConfiguredSite = (url: string | null): boolean => {
  const normalized = normalizeUrl(url)
  if (!normalized) return false

  const siteHostname = configuredSiteHostname.value
  if (!siteHostname) return true

  try {
    const urlHostname = normalizeHostname(new URL(normalized).hostname)
    return urlHostname !== siteHostname
  } catch {
    return true
  }
}

const galleryImages = computed<EventGalleryImageWithUrl[]>(() =>
  event.value.galleryImages.filter((img): img is EventGalleryImageWithUrl => Boolean(img.url))
)

const photosPerPage = 12
const currentGalleryPage = ref(1)
const loadedGalleryImages = reactive(new Set<string>())
const galleryImageAspectRatios = ref<Record<number, number>>({})
const galleryImageAspectRatioPreloads = new Map<number, Promise<number | null>>()

const totalGalleryImages = computed(() => galleryImages.value.length)
const totalGalleryPages = computed(() => Math.ceil(totalGalleryImages.value / photosPerPage))
const paginatedGalleryImages = computed(() => {
  const start = (currentGalleryPage.value - 1) * photosPerPage
  return galleryImages.value.slice(start, start + photosPerPage)
})

watch(currentGalleryPage, () => {
  loadedGalleryImages.clear()
})

watch(slug, () => {
  currentGalleryPage.value = 1
  loadedGalleryImages.clear()
  galleryImageAspectRatios.value = {}
  galleryImageAspectRatioPreloads.clear()
  selectedPhotoIndex.value = 0
  isLightboxOpen.value = false
  initialLightboxAspectRatio.value = null
  initialLightboxAspectRatioIndex.value = null
})

watch(totalGalleryPages, (pageCount) => {
  if (pageCount > 0 && currentGalleryPage.value > pageCount) {
    currentGalleryPage.value = pageCount
  }
})

function onGalleryImageLoad(pageIndex: number, absoluteIndex: number, event?: Event) {
  loadedGalleryImages.add(`${currentGalleryPage.value}-${pageIndex}`)

  const image = event?.target as HTMLImageElement | null
  if (image?.naturalWidth && image.naturalHeight) {
    galleryImageAspectRatios.value[absoluteIndex] = image.naturalWidth / image.naturalHeight
  }
}

function isGalleryImageLoading(index: number) {
  return !loadedGalleryImages.has(`${currentGalleryPage.value}-${index}`)
}

const isLightboxOpen = ref(false)
const selectedPhotoIndex = ref(0)
const initialLightboxAspectRatio = ref<number | null>(null)
const initialLightboxAspectRatioIndex = ref<number | null>(null)

function preloadGalleryImageAspectRatio(index: number, src: string) {
  const knownRatio = galleryImageAspectRatios.value[index]
  if (knownRatio && Number.isFinite(knownRatio)) {
    return Promise.resolve(knownRatio)
  }

  const existingPreload = galleryImageAspectRatioPreloads.get(index)
  if (existingPreload) {
    return existingPreload
  }

  if (!import.meta.client) {
    return Promise.resolve(null)
  }

  const preload = new Promise<number | null>((resolve) => {
    const image = new Image()
    const finalize = () => {
      const ratio =
        image.naturalWidth && image.naturalHeight ? image.naturalWidth / image.naturalHeight : null

      if (ratio) {
        galleryImageAspectRatios.value[index] = ratio
      }

      galleryImageAspectRatioPreloads.delete(index)
      resolve(ratio)
    }

    image.decoding = 'async'
    image.onload = finalize
    image.onerror = finalize
    image.src = src

    if (image.complete) {
      finalize()
    }
  })

  galleryImageAspectRatioPreloads.set(index, preload)
  return preload
}

function openLightbox(event: MouseEvent, index: number, src: string) {
  const trigger = event.currentTarget as HTMLElement | null
  const image = trigger?.querySelector('img')

  initialLightboxAspectRatio.value =
    image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : null
  initialLightboxAspectRatioIndex.value = index
  selectedPhotoIndex.value = index
  isLightboxOpen.value = true

  void preloadGalleryImageAspectRatio(index, src).then((ratio) => {
    if (selectedPhotoIndex.value !== index || !isLightboxOpen.value || !ratio) return

    initialLightboxAspectRatio.value = ratio
    initialLightboxAspectRatioIndex.value = index
  })
}

function getPhotoAlt(index: number): string {
  return t('events.galleryPhotoAlt', { number: index + 1, event: event.value.name })
}
</script>

<template>
  <UContainer class="py-8 sm:py-12">
    <div class="mx-auto max-w-4xl">
      <nav aria-label="Breadcrumb" class="mb-6">
        <ol class="text-muted flex min-w-0 items-center gap-2 text-sm">
          <li class="shrink-0">{{ t('nav.about.label') }}</li>
          <li class="shrink-0" aria-hidden="true">/</li>
          <li class="shrink-0">
            <NuxtLink
              :to="localePath('/conocenos/eventos')"
              class="hover:text-foreground transition-colors"
            >
              {{ t('events.title') }}
            </NuxtLink>
          </li>
          <li class="shrink-0" aria-hidden="true">/</li>
          <li class="text-foreground min-w-0 truncate font-medium">
            {{ event.name }}
          </li>
        </ol>
      </nav>

      <article class="space-y-8">
        <div v-if="event.banner.url" class="overflow-hidden rounded-lg">
          <NuxtImg
            :src="event.banner.url"
            :alt="t('events.bannerAlt', { event: event.name })"
            class="aspect-7/2 w-full object-cover"
            loading="eager"
            width="1280"
            height="366"
            format="webp"
            quality="74"
          />
        </div>

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

        <UCard v-if="event.description">
          <p class="leading-relaxed">{{ event.description }}</p>
        </UCard>

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
                  v-if="isExternalToConfiguredSite(org.link)"
                  :to="normalizeUrl(org.link) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

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
                  :to="normalizeUrl(venue.link) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

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
                  :to="normalizeUrl(collab.link) ?? undefined"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  size="sm"
                  icon="i-tabler-external-link"
                  :label="t('events.visitWebsite')"
                />
              </div>
            </UCard>
          </div>
        </section>

        <section v-if="galleryImages.length > 0" aria-labelledby="event-gallery">
          <UCard class="motion-card-subtle overflow-hidden">
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 id="event-gallery" class="flex items-center gap-2 text-xl font-semibold">
                <UIcon name="i-tabler-photo" class="text-primary size-5" />
                {{ t('events.gallery') }}
              </h2>
              <UBadge color="primary" variant="subtle" size="sm">{{ totalGalleryImages }}</UBadge>
            </div>

            <ul
              :aria-label="t('events.gallery')"
              class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
            >
              <li
                v-for="(img, pageIndex) in paginatedGalleryImages"
                :key="img.order"
                class="list-none"
              >
                <button
                  type="button"
                  :aria-label="getPhotoAlt((currentGalleryPage - 1) * photosPerPage + pageIndex)"
                  class="motion-link-card focus-visible:ring-primary group relative aspect-square w-full overflow-hidden rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
                  @click="
                    openLightbox(
                      $event,
                      (currentGalleryPage - 1) * photosPerPage + pageIndex,
                      img.url!
                    )
                  "
                >
                  <NuxtImg
                    :src="img.url!"
                    :alt="getPhotoAlt((currentGalleryPage - 1) * photosPerPage + pageIndex)"
                    class="motion-link-media size-full object-cover"
                    loading="lazy"
                    width="300"
                    height="300"
                    sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 45vw"
                    densities="x1 x2"
                    placeholder
                    format="webp"
                    quality="72"
                    @load="
                      onGalleryImageLoad(
                        pageIndex,
                        (currentGalleryPage - 1) * photosPerPage + pageIndex,
                        $event
                      )
                    "
                  />

                  <USkeleton
                    v-if="isGalleryImageLoading(pageIndex)"
                    class="absolute inset-0 size-full rounded-xl"
                  />

                  <div
                    class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/36"
                  >
                    <UIcon
                      name="i-tabler-zoom-in"
                      class="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </div>
                </button>
              </li>
            </ul>

            <div v-if="totalGalleryPages > 1" class="mt-6 flex justify-center">
              <UPagination
                v-model:page="currentGalleryPage"
                :total="totalGalleryImages"
                :items-per-page="photosPerPage"
                show-edges
                show-controls
              />
            </div>
          </UCard>
        </section>
      </article>

      <EventsGalleryLightbox
        v-if="galleryImages.length > 0"
        v-model:open="isLightboxOpen"
        v-model:index="selectedPhotoIndex"
        :photos="galleryImages"
        :event-title="event.name"
        :aspect-ratios="galleryImageAspectRatios"
        :initial-aspect-ratio="initialLightboxAspectRatio"
        :initial-aspect-ratio-index="initialLightboxAspectRatioIndex"
      />
    </div>
  </UContainer>
</template>
