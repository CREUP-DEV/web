<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { updateSiteDefaultImagesSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Imágenes por defecto',
})

interface SiteDefaultImagesPayload {
  pressReleaseImage: string | null
  statementImage: string | null
  mediaAppearanceImage: string | null
  newsletterCoverImage: string | null
  carouselSlideImage: string | null
  ogImage: string | null
  updatedAt: string | null
}

const toast = useToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  data: defaultsData,
  error: defaultsError,
  pending: defaultsPending,
  refresh: refreshDefaults,
} = await useFetch<{ data: SiteDefaultImagesPayload }>('/api/admin/site-default-images')

const serverItem = computed(() => defaultsData.value?.data ?? null)

const form = reactive({
  pressReleaseImage: null as string | null,
  statementImage: null as string | null,
  mediaAppearanceImage: null as string | null,
  newsletterCoverImage: null as string | null,
  carouselSlideImage: null as string | null,
  ogImage: null as string | null,
})

const releaseUpload = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.pressReleaseImage = storagePath
  },
  getFallbackPreview: () => form.pressReleaseImage,
})

const statementUpload = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.statementImage = storagePath
  },
  getFallbackPreview: () => form.statementImage,
})

const mediaUpload = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.mediaAppearanceImage = storagePath
  },
  getFallbackPreview: () => form.mediaAppearanceImage,
})

const newsletterUpload = useAdminFileUpload({
  endpoint: '/api/admin/newsletter/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.newsletterCoverImage = storagePath
  },
  getFallbackPreview: () => form.newsletterCoverImage,
})

const carouselUpload = useAdminFileUpload({
  endpoint: '/api/admin/home/upload',
  extraFields: { kind: 'carousel_default' },
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.carouselSlideImage = storagePath
  },
  getFallbackPreview: () => form.carouselSlideImage,
})

const ogUpload = useAdminFileUpload({
  endpoint: '/api/admin/home/upload',
  extraFields: { kind: 'site_og' },
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    form.ogImage = storagePath
  },
  getFallbackPreview: () => form.ogImage,
})

const isSaving = ref(false)

const buildPayloadSnapshot = () =>
  JSON.stringify({
    pressReleaseImage: form.pressReleaseImage,
    statementImage: form.statementImage,
    mediaAppearanceImage: form.mediaAppearanceImage,
    newsletterCoverImage: form.newsletterCoverImage,
    carouselSlideImage: form.carouselSlideImage,
    ogImage: form.ogImage,
  })

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

watch(
  serverItem,
  (item) => {
    form.pressReleaseImage = item?.pressReleaseImage ?? null
    form.statementImage = item?.statementImage ?? null
    form.mediaAppearanceImage = item?.mediaAppearanceImage ?? null
    form.newsletterCoverImage = item?.newsletterCoverImage ?? null
    form.carouselSlideImage = item?.carouselSlideImage ?? null
    form.ogImage = item?.ogImage ?? null
    releaseUpload.setPreview(item?.pressReleaseImage ?? null)
    statementUpload.setPreview(item?.statementImage ?? null)
    mediaUpload.setPreview(item?.mediaAppearanceImage ?? null)
    newsletterUpload.setPreview(item?.newsletterCoverImage ?? null)
    carouselUpload.setPreview(item?.carouselSlideImage ?? null)
    ogUpload.setPreview(item?.ogImage ?? null)
    clearErrors()
    resetFormSnapshot()
  },
  { immediate: true }
)

const save = async () => {
  const payload = {
    pressReleaseImage: form.pressReleaseImage,
    statementImage: form.statementImage,
    mediaAppearanceImage: form.mediaAppearanceImage,
    newsletterCoverImage: form.newsletterCoverImage,
    carouselSlideImage: form.carouselSlideImage,
    ogImage: form.ogImage,
  }

  if (!validate(updateSiteDefaultImagesSchema, payload)) {
    return
  }

  isSaving.value = true
  try {
    const response = await $fetch<{ data: SiteDefaultImagesPayload }>(
      '/api/admin/site-default-images',
      {
        method: 'PUT',
        body: {
          ...payload,
          updatedAt: serverItem.value?.updatedAt ?? undefined,
        },
      }
    )
    defaultsData.value = { data: response.data }
    clearErrors()
    await refreshAllClientAsyncData()
    toast.add({ title: 'Imágenes por defecto guardadas', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudieron guardar las imágenes'),
      color: 'error',
    })
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-10">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <section>
        <h1 class="text-2xl font-bold">Imágenes por defecto</h1>
        <p class="text-muted mt-1 max-w-3xl text-sm">
          Configura las imágenes que se muestran cuando no hay una portada propia en prensa,
          newsletter o carrusel de inicio.
        </p>
      </section>
      <UButton
        v-if="!defaultsPending && !defaultsError"
        type="button"
        class="shrink-0 self-start sm:self-center"
        icon="i-tabler-device-floppy"
        :loading="isSaving"
        :disabled="!hasFormChanges"
        @click="save"
      >
        Guardar cambios
      </UButton>
    </div>

    <div v-if="defaultsPending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-40 w-full rounded-2xl" />
      <USkeleton class="h-40 w-full rounded-2xl" />
    </div>

    <div v-else-if="defaultsError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudieron cargar las imágenes por defecto"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshDefaults()">
        Reintentar
      </UButton>
    </div>

    <div v-else class="space-y-10">
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Prensa</h2>
        <p class="text-muted max-w-3xl text-sm">
          Se usan en el listado y fichas cuando el artículo no tiene imagen de portada.
        </p>

        <div class="grid gap-6 lg:grid-cols-3">
          <UCard>
            <div class="space-y-4">
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-tabler-file-text" class="text-muted size-5" />
                Notas de prensa
              </div>
              <div v-if="releaseUpload.preview.value" class="overflow-hidden rounded-lg border">
                <img
                  :src="releaseUpload.preview.value"
                  alt=""
                  class="aspect-video w-full object-cover"
                />
              </div>
              <div
                v-else
                class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
              >
                <p class="text-muted text-sm">Sin imagen por defecto</p>
              </div>
              <input
                :ref="releaseUpload.inputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                class="sr-only"
                tabindex="-1"
                aria-hidden="true"
                @change="releaseUpload.handleFileSelect"
              />
              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  variant="outline"
                  size="sm"
                  icon="i-tabler-upload"
                  :loading="releaseUpload.isUploading.value"
                  @click="releaseUpload.triggerFileDialog()"
                >
                  {{ releaseUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
                </UButton>
                <UButton
                  v-if="form.pressReleaseImage"
                  type="button"
                  variant="ghost"
                  color="error"
                  size="sm"
                  icon="i-tabler-trash"
                  @click="
                    () => {
                      form.pressReleaseImage = null
                      releaseUpload.setPreview(null)
                    }
                  "
                >
                  Quitar
                </UButton>
              </div>
              <p v-if="getFieldError('pressReleaseImage')" class="text-error text-xs" role="alert">
                {{ getFieldError('pressReleaseImage') }}
              </p>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-4">
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-tabler-speakerphone" class="text-muted size-5" />
                Comunicados
              </div>
              <div v-if="statementUpload.preview.value" class="overflow-hidden rounded-lg border">
                <img
                  :src="statementUpload.preview.value"
                  alt=""
                  class="aspect-video w-full object-cover"
                />
              </div>
              <div
                v-else
                class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
              >
                <p class="text-muted text-sm">Sin imagen por defecto</p>
              </div>
              <input
                :ref="statementUpload.inputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                class="sr-only"
                tabindex="-1"
                aria-hidden="true"
                @change="statementUpload.handleFileSelect"
              />
              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  variant="outline"
                  size="sm"
                  icon="i-tabler-upload"
                  :loading="statementUpload.isUploading.value"
                  @click="statementUpload.triggerFileDialog()"
                >
                  {{ statementUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
                </UButton>
                <UButton
                  v-if="form.statementImage"
                  type="button"
                  variant="ghost"
                  color="error"
                  size="sm"
                  icon="i-tabler-trash"
                  @click="
                    () => {
                      form.statementImage = null
                      statementUpload.setPreview(null)
                    }
                  "
                >
                  Quitar
                </UButton>
              </div>
              <p v-if="getFieldError('statementImage')" class="text-error text-xs" role="alert">
                {{ getFieldError('statementImage') }}
              </p>
            </div>
          </UCard>

          <UCard>
            <div class="space-y-4">
              <div class="flex items-center gap-2 font-semibold">
                <UIcon name="i-tabler-broadcast" class="text-muted size-5" />
                Apariciones en medios
              </div>
              <div v-if="mediaUpload.preview.value" class="overflow-hidden rounded-lg border">
                <img
                  :src="mediaUpload.preview.value"
                  alt=""
                  class="aspect-video w-full object-cover"
                />
              </div>
              <div
                v-else
                class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
              >
                <p class="text-muted text-sm">Sin imagen por defecto</p>
              </div>
              <input
                :ref="mediaUpload.inputRef"
                type="file"
                accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                class="sr-only"
                tabindex="-1"
                aria-hidden="true"
                @change="mediaUpload.handleFileSelect"
              />
              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  variant="outline"
                  size="sm"
                  icon="i-tabler-upload"
                  :loading="mediaUpload.isUploading.value"
                  @click="mediaUpload.triggerFileDialog()"
                >
                  {{ mediaUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
                </UButton>
                <UButton
                  v-if="form.mediaAppearanceImage"
                  type="button"
                  variant="ghost"
                  color="error"
                  size="sm"
                  icon="i-tabler-trash"
                  @click="
                    () => {
                      form.mediaAppearanceImage = null
                      mediaUpload.setPreview(null)
                    }
                  "
                >
                  Quitar
                </UButton>
              </div>
              <p
                v-if="getFieldError('mediaAppearanceImage')"
                class="text-error text-xs"
                role="alert"
              >
                {{ getFieldError('mediaAppearanceImage') }}
              </p>
            </div>
          </UCard>
        </div>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Newsletter</h2>
        <p class="text-muted max-w-3xl text-sm">
          Portada por defecto del archivo público y del correo cuando una edición no tiene imagen
          propia. En la web se muestra cuadrada (hasta 240px de lado).
        </p>
        <UCard class="max-w-xl">
          <div class="space-y-4">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon name="i-tabler-mail" class="text-muted size-5" />
              Portada newsletter
            </div>
            <p class="text-muted text-xs">
              Vista previa 1∶1, ancho máximo 240px (igual que las tarjetas del archivo).
            </p>
            <div class="mx-auto w-full max-w-60">
              <div
                v-if="newsletterUpload.preview.value"
                class="relative aspect-square w-full overflow-hidden rounded-lg border"
              >
                <img :src="newsletterUpload.preview.value" alt="" class="size-full object-cover" />
              </div>
              <div
                v-else
                class="bg-muted/10 flex aspect-square w-full items-center justify-center rounded-lg border-2 border-dashed"
              >
                <p class="text-muted px-2 text-center text-sm">Sin imagen por defecto</p>
              </div>
            </div>
            <input
              :ref="newsletterUpload.inputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
              class="sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="newsletterUpload.handleFileSelect"
            />
            <div class="flex flex-wrap gap-2">
              <UButton
                type="button"
                variant="outline"
                size="sm"
                icon="i-tabler-upload"
                :loading="newsletterUpload.isUploading.value"
                @click="newsletterUpload.triggerFileDialog()"
              >
                {{ newsletterUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
              </UButton>
              <UButton
                v-if="form.newsletterCoverImage"
                type="button"
                variant="ghost"
                color="error"
                size="sm"
                icon="i-tabler-trash"
                @click="
                  () => {
                    form.newsletterCoverImage = null
                    newsletterUpload.setPreview(null)
                  }
                "
              >
                Quitar
              </UButton>
            </div>
            <p v-if="getFieldError('newsletterCoverImage')" class="text-error text-xs" role="alert">
              {{ getFieldError('newsletterCoverImage') }}
            </p>
          </div>
        </UCard>
      </section>

      <section class="space-y-4">
        <h2 class="text-lg font-semibold">Carrusel (inicio)</h2>
        <p class="text-muted max-w-3xl text-sm">
          Imagen mostrada cuando un slide activo no tiene archivo propio. Misma proporción que el
          bloque de inicio: <span class="text-foreground/90">1925×550 px</span> (≈ 3,5∶1).
        </p>
        <UCard>
          <div class="space-y-4">
            <div class="flex items-center gap-2 font-semibold">
              <UIcon name="i-tabler-photo" class="text-muted size-5" />
              Slide por defecto
            </div>
            <div
              v-if="carouselUpload.preview.value"
              class="relative aspect-1925/550 w-full overflow-hidden rounded-lg border"
            >
              <img :src="carouselUpload.preview.value" alt="" class="size-full object-cover" />
            </div>
            <div
              v-else
              class="bg-muted/10 flex aspect-1925/550 w-full items-center justify-center rounded-lg border-2 border-dashed"
            >
              <p class="text-muted px-4 text-center text-sm">Sin imagen por defecto</p>
            </div>
            <input
              :ref="carouselUpload.inputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
              class="sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="carouselUpload.handleFileSelect"
            />
            <div class="flex flex-wrap gap-2">
              <UButton
                type="button"
                variant="outline"
                size="sm"
                icon="i-tabler-upload"
                :loading="carouselUpload.isUploading.value"
                @click="carouselUpload.triggerFileDialog()"
              >
                {{ carouselUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
              </UButton>
              <UButton
                v-if="form.carouselSlideImage"
                type="button"
                variant="ghost"
                color="error"
                size="sm"
                icon="i-tabler-trash"
                @click="
                  () => {
                    form.carouselSlideImage = null
                    carouselUpload.setPreview(null)
                  }
                "
              >
                Quitar
              </UButton>
            </div>
            <p v-if="getFieldError('carouselSlideImage')" class="text-error text-xs" role="alert">
              {{ getFieldError('carouselSlideImage') }}
            </p>
          </div>
        </UCard>
      </section>

      <section class="space-y-3">
        <h2 class="text-base font-semibold">SEO y redes sociales</h2>
        <p class="text-muted max-w-xl text-xs">
          ogImage por defecto para páginas sin imagen propia. Sube un JPG de
          <span class="text-foreground/90">1200×630 px</span>.
        </p>
        <UCard class="max-w-md">
          <div class="space-y-3">
            <div class="flex items-center gap-2 text-sm font-semibold">
              <UIcon name="i-tabler-share-3" class="text-muted size-4" />
              ogImage por defecto
            </div>
            <div
              v-if="ogUpload.preview.value"
              class="relative aspect-1200/630 w-full overflow-hidden rounded-lg border"
            >
              <img :src="ogUpload.preview.value" alt="" class="size-full object-cover" />
            </div>
            <div
              v-else
              class="bg-muted/10 flex aspect-1200/630 w-full items-center justify-center rounded-lg border-2 border-dashed"
            >
              <p class="text-muted px-3 text-center text-xs">Sin ogImage por defecto</p>
            </div>
            <input
              :ref="ogUpload.inputRef"
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
              class="sr-only"
              tabindex="-1"
              aria-hidden="true"
              @change="ogUpload.handleFileSelect"
            />
            <div class="flex flex-wrap gap-2">
              <UButton
                type="button"
                variant="outline"
                size="xs"
                icon="i-tabler-upload"
                :loading="ogUpload.isUploading.value"
                @click="ogUpload.triggerFileDialog()"
              >
                {{ ogUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
              </UButton>
              <UButton
                v-if="form.ogImage"
                type="button"
                variant="ghost"
                color="error"
                size="xs"
                icon="i-tabler-trash"
                @click="
                  () => {
                    form.ogImage = null
                    ogUpload.setPreview(null)
                  }
                "
              >
                Quitar
              </UButton>
            </div>
            <p v-if="getFieldError('ogImage')" class="text-error text-xs" role="alert">
              {{ getFieldError('ogImage') }}
            </p>
          </div>
        </UCard>
      </section>
    </div>
  </div>
</template>
