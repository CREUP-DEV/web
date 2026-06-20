<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { updatePressDossierSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Dossier de prensa',
})

interface PressDossierItem {
  id: string
  pdfUrl: string | null
  active: boolean
  updatedAt: string
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, formErrors, getFieldError, validate } = useFormValidation()

const {
  data: dossierData,
  error: dossierError,
  pending: dossierPending,
  refresh: refreshDossier,
} = await useFetch<{
  data: PressDossierItem | null
}>('/api/admin/press-dossier', {
  headers: localeApiHeaders,
})

const dossierItem = computed(() => dossierData.value?.data ?? null)

const form = reactive({
  pdfUrl: null as string | null,
  active: false,
})

const pdfInputRef = ref<HTMLInputElement | null>(null)
const selectedPdfFile = ref<File | null>(null)
const pendingPdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)
const isSaving = ref(false)
const showClearPdfModal = ref(false)

const buildPayloadSnapshot = () =>
  JSON.stringify({
    pdfUrl: form.pdfUrl,
    active: form.active,
    hasPendingPdfUpload: Boolean(selectedPdfFile.value),
    pendingPdfName: pendingPdfName.value,
  })

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

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
    clearErrors()
    resetFormSnapshot()
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
  clearErrors()
}

const requestClearPdf = () => {
  showClearPdfModal.value = true
}

const confirmClearPdf = () => {
  clearPdf()
  showClearPdfModal.value = false
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
  if (!hasFormChanges.value) {
    return
  }

  isSaving.value = true

  try {
    let pdfUrl = form.pdfUrl

    if (selectedPdfFile.value) {
      isUploadingPdf.value = true
      const result = await uploadPdf(selectedPdfFile.value)
      pdfUrl = result.storagePath
      form.pdfUrl = result.storagePath
    }

    const payload = {
      pdfUrl,
      active: form.active,
    }

    if (!validate(updatePressDossierSchema, payload)) {
      return
    }

    const response = await $fetch<{ data: PressDossierItem }>('/api/admin/press-dossier', {
      method: 'PUT',
      body: {
        ...payload,
        updatedAt: dossierItem.value?.updatedAt,
      },
    })

    dossierData.value = { data: response.data }
    clearErrors()
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.pressDossier.saveSuccess'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.pressDossier.saveError')),
      color: 'error',
    })
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
        <h1 class="text-2xl font-bold">{{ t('admin.pressDossier.title') }}</h1>
        <p class="text-muted mt-1 text-sm">
          {{ t('admin.pressDossier.intro') }}
        </p>
      </div>
    </section>

    <div v-if="dossierPending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-52 w-full rounded-2xl" />
      <USkeleton class="h-10 w-40 rounded-lg" />
    </div>

    <div v-else-if="dossierError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.pressDossier.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refreshDossier()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <UCard v-else>
      <div class="space-y-6">
        <AdminFormErrorSummary :errors="formErrors" />
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
                    {{ currentPdfName || t('admin.pressDossier.noDossier') }}
                  </p>
                  <p class="text-muted text-sm">
                    {{
                      form.pdfUrl
                        ? t('admin.pressDossier.pdfReady')
                        : t('admin.pressDossier.pdfUploadHint')
                    }}
                  </p>
                </div>
              </div>

              <UFormField :error="getFieldError('pdfUrl')">
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
                    {{
                      form.pdfUrl
                        ? t('admin.pressDossier.changePdf')
                        : t('admin.pressDossier.uploadPdf')
                    }}
                  </UButton>

                  <UButton
                    v-if="form.pdfUrl"
                    :href="form.pdfUrl"
                    external
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="ghost"
                    color="neutral"
                    icon="i-tabler-external-link"
                  >
                    {{ t('admin.pressDossier.viewCurrentPdf') }}
                  </UButton>

                  <UButton
                    v-if="form.pdfUrl || pendingPdfName"
                    type="button"
                    variant="ghost"
                    color="error"
                    icon="i-tabler-trash"
                    @click="requestClearPdf"
                  >
                    {{ t('admin.pressDossier.removePdf') }}
                  </UButton>
                </div>
              </UFormField>
            </div>

            <div class="rounded-xl border px-4 py-3">
              <p class="text-sm font-medium">{{ t('admin.pressDossier.statusLabel') }}</p>
              <div class="mt-2 flex items-center gap-2">
                <USwitch v-model="form.active" :disabled="!form.pdfUrl && !pendingPdfName" />
                <span class="text-sm">{{
                  form.active ? t('admin.common.active') : t('admin.common.inactive')
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end">
          <UButton
            type="button"
            icon="i-tabler-device-floppy"
            :loading="isSaving"
            :disabled="!hasFormChanges"
            @click="saveDossier"
          >
            {{ t('admin.pressDossier.saveChanges') }}
          </UButton>
        </div>
      </div>
    </UCard>

    <UModal
      v-model:open="showClearPdfModal"
      :title="t('admin.pressDossier.removePdf')"
      :description="t('admin.pressDossier.removePdfConfirm')"
      :ui="{ content: 'sm:max-w-sm' }"
    >
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-base font-bold">{{ t('admin.pressDossier.removePdf') }}</h2>
          </div>
          <p class="text-muted mb-6 text-sm">
            {{ t('admin.pressDossier.removePdfConfirm') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showClearPdfModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" @click="confirmClearPdf">{{
              t('admin.pressDossier.removePdf')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
