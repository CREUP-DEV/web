<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { updateAboutPageContentClientSchema } from '~~/shared/utils/adminClientSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Qué es CREUP',
})

interface AboutContent {
  id: string
  heroImage: string | null
  heroVisible: boolean
  updatedAt: string
}

const toast = useToast()
const { refreshAboutPage } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  data: contentData,
  error: contentError,
  pending: contentPending,
  refresh: refreshContent,
} = await useFetch<{
  data: AboutContent | null
}>('/api/admin/about')

const contentItem = computed(() => contentData.value?.data ?? null)

const contentForm = reactive({
  heroImage: null as string | null,
  heroVisible: false,
})

const buildContentSnapshot = () =>
  JSON.stringify({
    heroImage: contentForm.heroImage,
    heroVisible: contentForm.heroVisible,
  })

const isSavingContent = ref(false)
const showClearHeroModal = ref(false)
const heroImageVersion = ref<number | null>(null)
const heroUpload = useAdminFileUpload({
  endpoint: '/api/admin/about/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    clearErrors()
    contentForm.heroImage = storagePath
    contentForm.heroVisible = true
    heroImageVersion.value = Date.now()
  },
  getFallbackPreview: () => contentForm.heroImage,
})

const withCacheBuster = (url: string | null, version: number | null) => {
  if (!url || !version || !url.startsWith('/')) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
const heroPreview = computed(
  () => heroUpload.preview.value || withCacheBuster(contentForm.heroImage, heroImageVersion.value)
)
const currentHeroName = computed(() => contentForm.heroImage?.split('/').pop() ?? null)
const { hasFormChanges: hasPendingHeroChanges, resetFormSnapshot: resetContentSnapshot } =
  useFormSnapshot(buildContentSnapshot)

watch(
  contentItem,
  (item) => {
    contentForm.heroImage = item?.heroImage ?? null
    contentForm.heroVisible = item?.heroVisible ?? false
    heroUpload.setPreview(null)
    clearErrors()
    resetContentSnapshot()
  },
  { immediate: true }
)

const triggerHeroUpload = () => {
  heroUpload.triggerFileDialog()
}

const discardPendingHero = () => {
  contentForm.heroImage = contentItem.value?.heroImage ?? null
  contentForm.heroVisible = contentItem.value?.heroVisible ?? false
  heroUpload.setPreview(null)
  clearErrors()
}

const clearHero = () => {
  contentForm.heroImage = null
  contentForm.heroVisible = false
  heroImageVersion.value = null
  heroUpload.setPreview(null)
  clearErrors()
}

const requestClearHero = () => {
  showClearHeroModal.value = true
}

const confirmClearHero = () => {
  clearHero()
  showClearHeroModal.value = false
}

const saveContent = async () => {
  const payload = {
    heroImage: contentForm.heroImage,
    heroVisible: contentForm.heroVisible,
  }

  if (!hasPendingHeroChanges.value) {
    return
  }

  if (!validate(updateAboutPageContentClientSchema, payload)) {
    return
  }

  isSavingContent.value = true

  try {
    await $fetch('/api/admin/about', {
      method: 'PUT',
      body: {
        ...payload,
        updatedAt: contentItem.value?.updatedAt,
      },
    })

    await refreshContent()
    await refreshAboutPage()
    heroUpload.setPreview(null)
    toast.add({ title: 'Cambios guardados', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudieron guardar los cambios'),
      color: 'error',
    })
  } finally {
    isSavingContent.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <section>
      <div>
        <h1 class="text-2xl font-bold">Qué es CREUP</h1>
        <p class="text-muted mt-1 text-sm">Gestiona el banner principal visible en la página.</p>
      </div>
    </section>

    <div v-if="contentPending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-72 w-full rounded-2xl" />
      <USkeleton class="h-10 w-40 rounded-lg" />
      <USkeleton class="h-10 w-32 rounded-lg" />
    </div>

    <div v-else-if="contentError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudo cargar el contenido de Qué es CREUP"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshContent()">
        Reintentar
      </UButton>
    </div>

    <UCard v-else>
      <div class="space-y-6">
        <div class="bg-muted aspect-1925/550 overflow-hidden rounded-2xl border">
          <img
            v-if="heroPreview"
            :src="heroPreview"
            alt="Vista previa del banner principal"
            class="size-full object-cover"
          />
          <div v-else class="text-muted flex size-full items-center justify-center text-sm">
            No hay banner subido
          </div>
        </div>

        <div class="rounded-2xl border p-4">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div class="min-w-0 flex-1 space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="
                    contentForm.heroImage
                      ? contentForm.heroVisible
                        ? 'success'
                        : 'neutral'
                      : 'warning'
                  "
                  variant="subtle"
                  size="sm"
                >
                  {{
                    !contentForm.heroImage
                      ? 'Sin banner'
                      : contentForm.heroVisible
                        ? 'Visible'
                        : 'Oculto'
                  }}
                </UBadge>
                <UBadge v-if="hasPendingHeroChanges" color="primary" variant="subtle" size="sm">
                  Cambios pendientes
                </UBadge>
              </div>

              <div>
                <p class="font-medium">{{ currentHeroName || 'No hay banner configurado' }}</p>
                <p class="text-muted mt-1 text-sm">
                  {{
                    contentForm.heroImage
                      ? 'Activa el interruptor para mostrarlo en la web o quítalo si ya no debe usarse.'
                      : 'Sube una imagen para habilitar el banner en la página pública.'
                  }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2">
                <UButton
                  type="button"
                  variant="outline"
                  icon="i-tabler-upload"
                  :loading="heroUpload.isUploading.value"
                  @click="triggerHeroUpload"
                >
                  {{ contentForm.heroImage ? 'Cambiar imagen' : 'Subir imagen' }}
                </UButton>

                <UButton
                  v-if="hasPendingHeroChanges"
                  type="button"
                  variant="ghost"
                  color="neutral"
                  icon="i-tabler-x"
                  @click="discardPendingHero"
                >
                  Descartar selección
                </UButton>

                <UButton
                  v-if="contentForm.heroImage || heroUpload.preview"
                  type="button"
                  variant="ghost"
                  color="error"
                  icon="i-tabler-trash"
                  @click="requestClearHero"
                >
                  Quitar banner
                </UButton>
              </div>
              <p v-if="getFieldError('heroImage')" class="text-error text-sm">
                {{ getFieldError('heroImage') }}
              </p>
            </div>

            <div class="rounded-xl border px-4 py-3 lg:min-w-56">
              <p class="text-sm font-medium">Estado</p>
              <p class="text-muted mt-1 text-sm">
                {{
                  contentForm.heroImage
                    ? 'Controla si el banner se muestra en la página.'
                    : 'Necesitas una imagen para poder activarlo.'
                }}
              </p>
              <div class="mt-3 flex items-center gap-2">
                <USwitch v-model="contentForm.heroVisible" :disabled="!contentForm.heroImage" />
                <span class="text-sm">{{ contentForm.heroVisible ? 'Visible' : 'Oculto' }}</span>
              </div>
            </div>
          </div>
        </div>

        <input
          :ref="heroUpload.inputRef"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
          class="hidden"
          @change="heroUpload.handleFileSelect"
        />

        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-tabler-device-floppy"
            :loading="isSavingContent"
            :disabled="!hasPendingHeroChanges"
            @click="saveContent"
          >
            Guardar cambios
          </UButton>
        </div>

        <p class="text-muted text-sm leading-relaxed">Proporción recomendada: 1925 x 550 px.</p>
      </div>
    </UCard>

    <UModal v-model:open="showClearHeroModal" :ui="{ content: 'sm:max-w-sm' }">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-base font-bold">Quitar banner</h2>
          </div>
          <p class="text-muted mb-6 text-sm">
            Se eliminará la imagen seleccionada del banner principal. Tendrás que guardarla de nuevo
            si cambias de idea.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showClearHeroModal = false">Cancelar</UButton>
            <UButton color="error" @click="confirmClearHero">Quitar banner</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
