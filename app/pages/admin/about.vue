<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Qué es CREUP',
})

interface AboutContent {
  id: string
  heroImage: string | null
  heroVisible: boolean
}

const toast = useToast()

const { data: contentData, refresh: refreshContent } = await useFetch<{
  item: AboutContent | null
}>('/api/admin/about')

const contentItem = computed(() => contentData.value?.item ?? null)

const contentForm = reactive({
  heroImage: null as string | null,
  heroVisible: false,
})

const isSavingContent = ref(false)
const heroInputRef = ref<HTMLInputElement | null>(null)
const selectedHeroFile = ref<File | null>(null)
const pendingHeroPreviewUrl = ref<string | null>(null)
const heroImageVersion = ref<number | null>(null)
const withCacheBuster = (url: string | null, version: number | null) => {
  if (!url || !version || !url.startsWith('/')) {
    return url
  }

  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}v=${version}`
}
const heroPreview = computed(
  () =>
    pendingHeroPreviewUrl.value || withCacheBuster(contentForm.heroImage, heroImageVersion.value)
)
const currentHeroName = computed(() => contentForm.heroImage?.split('/').pop() ?? null)
const hasPendingHeroChanges = computed(() => selectedHeroFile.value !== null)

const clearPendingHeroPreview = () => {
  if (pendingHeroPreviewUrl.value) {
    URL.revokeObjectURL(pendingHeroPreviewUrl.value)
    pendingHeroPreviewUrl.value = null
  }
}

watch(
  contentItem,
  (item) => {
    contentForm.heroImage = item?.heroImage ?? null
    contentForm.heroVisible = item?.heroVisible ?? false
  },
  { immediate: true }
)

onUnmounted(() => {
  clearPendingHeroPreview()
})

const triggerHeroUpload = () => {
  heroInputRef.value?.click()
}

const discardPendingHero = () => {
  selectedHeroFile.value = null
  clearPendingHeroPreview()
}

const clearHero = () => {
  selectedHeroFile.value = null
  clearPendingHeroPreview()
  contentForm.heroImage = null
  contentForm.heroVisible = false
  heroImageVersion.value = null
}

const uploadImage = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return $fetch<{ path: string; storagePath: string }>('/api/admin/about/upload', {
    method: 'POST',
    body: formData,
  })
}

const handleHeroFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  clearPendingHeroPreview()
  selectedHeroFile.value = file
  pendingHeroPreviewUrl.value = URL.createObjectURL(file)
  contentForm.heroVisible = true
  toast.add({
    title: 'Imagen preparada',
    description: 'Guarda los cambios para sustituir el banner actual.',
    color: 'success',
  })
  target.value = ''
}

const saveContent = async () => {
  isSavingContent.value = true

  try {
    if (selectedHeroFile.value) {
      const result = await uploadImage(selectedHeroFile.value)
      contentForm.heroImage = result.storagePath
      heroImageVersion.value = Date.now()
    }

    await $fetch('/api/admin/about', {
      method: 'PUT',
      body: {
        heroImage: contentForm.heroImage,
        heroVisible: contentForm.heroVisible,
      },
    })

    await refreshContent()
    selectedHeroFile.value = null
    clearPendingHeroPreview()
    toast.add({ title: 'Cambios guardados', color: 'success' })
  } catch (error) {
    console.error('Error saving about content:', error)
    toast.add({ title: 'No se pudieron guardar los cambios', color: 'error' })
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

    <UCard>
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
                  v-if="contentForm.heroImage || pendingHeroPreviewUrl"
                  type="button"
                  variant="ghost"
                  color="error"
                  icon="i-tabler-trash"
                  @click="clearHero"
                >
                  Quitar banner
                </UButton>
              </div>
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
          ref="heroInputRef"
          type="file"
          accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
          class="hidden"
          @change="handleHeroFileSelect"
        />

        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-tabler-device-floppy"
            :loading="isSavingContent"
            @click="saveContent"
          >
            Guardar cambios
          </UButton>
        </div>

        <p class="text-muted text-sm leading-relaxed">Proporción recomendada: 1925 x 550 px.</p>
      </div>
    </UCard>
  </div>
</template>
