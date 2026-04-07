<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Dossier de prensa',
})

interface PressDossierItem {
  id: string
  pdfUrl: string | null
  active: boolean
}

const toast = useToast()

const { data: dossierData, refresh: refreshDossier } = await useFetch<{
  item: PressDossierItem | null
}>('/api/admin/press-dossier')

const dossierItem = computed(() => dossierData.value?.item ?? null)

const form = reactive({
  pdfUrl: null as string | null,
  active: false,
})

const pdfInputRef = ref<HTMLInputElement | null>(null)
const selectedPdfFile = ref<File | null>(null)
const pendingPdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)
const isSaving = ref(false)

const currentPdfName = computed(() => {
  if (pendingPdfName.value) {
    return pendingPdfName.value
  }

  return form.pdfUrl?.split('/').pop() ?? null
})

watch(
  dossierItem,
  (item) => {
    form.pdfUrl = item?.pdfUrl ?? null
    form.active = item?.active ?? false
    selectedPdfFile.value = null
    pendingPdfName.value = null
  },
  { immediate: true }
)

const triggerPdfUpload = () => {
  pdfInputRef.value?.click()
}

const handlePdfSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) {
    return
  }

  selectedPdfFile.value = file
  pendingPdfName.value = file.name
  form.active = true
  target.value = ''
}

const clearPdf = () => {
  form.pdfUrl = null
  selectedPdfFile.value = null
  pendingPdfName.value = null
  form.active = false
}

const uploadPdf = async (file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return $fetch<{ storagePath: string }>('/api/admin/press-dossier/upload', {
    method: 'POST',
    body: formData,
  })
}

const saveDossier = async () => {
  if (form.active && !selectedPdfFile.value && !form.pdfUrl) {
    toast.add({ title: 'Debes subir un PDF para activar el dossier', color: 'error' })
    return
  }

  isSaving.value = true

  try {
    if (selectedPdfFile.value) {
      isUploadingPdf.value = true
      const result = await uploadPdf(selectedPdfFile.value)
      form.pdfUrl = result.storagePath
    }

    await $fetch('/api/admin/press-dossier', {
      method: 'PUT',
      body: {
        pdfUrl: form.pdfUrl,
        active: form.active,
      },
    })

    await refreshDossier()
    toast.add({ title: 'Dossier guardado', color: 'success' })
  } catch (error) {
    console.error('Error saving press dossier:', error)
    toast.add({ title: 'No se pudo guardar el dossier', color: 'error' })
  } finally {
    isUploadingPdf.value = false
    isSaving.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <section>
      <div>
        <h1 class="text-2xl font-bold">Dossier de prensa</h1>
        <p class="text-muted mt-1 text-sm">
          Sube el PDF que se enlazará desde el menú de navegación cuando esté activo.
        </p>
      </div>
    </section>

    <UCard>
      <div class="space-y-6">
        <div class="rounded-2xl border p-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="min-w-0 space-y-2">
              <div class="flex items-center gap-3">
                <div
                  class="bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl"
                >
                  <UIcon name="i-tabler-file-type-pdf" class="size-6" />
                </div>
                <div>
                  <p class="font-medium">
                    {{ currentPdfName || 'No hay dossier subido' }}
                  </p>
                  <p class="text-muted text-sm">
                    {{
                      form.pdfUrl ? 'PDF preparado para publicar.' : 'Sube un PDF para activarlo.'
                    }}
                  </p>
                </div>
              </div>

              <div class="flex flex-wrap gap-2">
                <input
                  ref="pdfInputRef"
                  type="file"
                  accept=".pdf"
                  class="hidden"
                  @change="handlePdfSelect"
                />

                <UButton
                  type="button"
                  variant="outline"
                  icon="i-tabler-upload"
                  :loading="isUploadingPdf"
                  @click="triggerPdfUpload"
                >
                  {{ form.pdfUrl ? 'Cambiar PDF' : 'Subir PDF' }}
                </UButton>

                <UButton
                  v-if="form.pdfUrl"
                  :to="form.pdfUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="ghost"
                  color="neutral"
                  icon="i-tabler-external-link"
                >
                  Ver PDF actual
                </UButton>

                <UButton
                  v-if="form.pdfUrl || pendingPdfName"
                  type="button"
                  variant="ghost"
                  color="error"
                  icon="i-tabler-trash"
                  @click="clearPdf"
                >
                  Quitar PDF
                </UButton>
              </div>
            </div>

            <div class="rounded-xl border px-4 py-3">
              <p class="text-sm font-medium">Estado</p>
              <div class="mt-2 flex items-center gap-2">
                <USwitch v-model="form.active" :disabled="!form.pdfUrl && !pendingPdfName" />
                <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-tabler-device-floppy"
            :loading="isSaving"
            @click="saveDossier"
          >
            Guardar cambios
          </UButton>
        </div>
      </div>
    </UCard>
  </div>
</template>
