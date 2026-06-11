<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createEqualityDocumentSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Igualdad',
})

interface EqualityDocumentTranslation {
  locale: string
  title: string
  description: string
  meta: string
}

interface EqualityDocument {
  id: string
  pdfUrl: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
  translations: EqualityDocumentTranslation[]
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()
const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: EqualityDocument[]
}>('/api/admin/equality', {
  headers: localeApiHeaders,
  lazy: true,
})
const sortEqualityDocuments = (left: EqualityDocument, right: EqualityDocument) => {
  if (left.order !== right.order) {
    return left.order - right.order
  }

  return left.id.localeCompare(right.id, 'es')
}

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data, {
  sortItems: sortEqualityDocuments,
})
const isSubmitting = ref(false)
const isDeleting = ref(false)

const pdfInputRef = ref<HTMLInputElement | null>(null)
const pdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)

const createEmptyTranslationSet = () =>
  createEmptyTranslations<EqualityDocumentTranslation>({
    title: '',
    description: '',
    meta: '',
  })

const form = reactive({
  pdfUrl: '',
  order: 0,
  active: true,
  translations: createEmptyTranslationSet(),
})

const buildPayload = () => ({
  pdfUrl: form.pdfUrl,
  order: form.order,
  active: form.active,
  translations: form.translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title,
    description: translation.description,
    meta: translation.meta,
  })),
})

const buildPayloadSnapshot = () => JSON.stringify(buildPayload())

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

const {
  cancelOrderChanges,
  closeDeleteModal,
  closeModal,
  confirmDelete,
  editingItem,
  hasOrderChanges,
  isSavingOrder,
  itemToDelete,
  listRef,
  localItems,
  openCreate,
  openEdit,
  persistOrder,
  showDeleteModal,
  showModal,
} = useAdminCollectionState<EqualityDocument>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/equality/reorder', {
      method: 'POST',
      body: { items: updates },
    })
    setItems(
      items.value.map((item) => {
        const nextOrder = updates.find((update) => update.id === item.id)?.order
        return nextOrder === undefined ? item : { ...item, order: nextOrder }
      })
    )
  },
  prepareCreate: () => {
    clearErrors()
    form.pdfUrl = ''
    form.order = items.value.length
    form.active = true
    form.translations = createEmptyTranslationSet()
    pdfName.value = null
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.pdfUrl = item.pdfUrl
    form.order = item.order
    form.active = item.active
    form.translations = mapTranslationsToForm(item.translations, {
      title: '',
      description: '',
      meta: '',
    }) as EqualityDocumentTranslation[]
    pdfName.value = item.pdfUrl.split('/').pop() ?? null
    resetFormSnapshot()
  },
})

function getDocumentTitle(item: EqualityDocument | null) {
  if (!item) return ''

  return getDefaultTranslationValue(item.translations, 'title') || item.translations[0]?.title || ''
}

function getDocumentMeta(item: EqualityDocument) {
  return getDefaultTranslationValue(item.translations, 'meta') || item.translations[0]?.meta || ''
}

function getAdditionalTranslationCount(item: EqualityDocument) {
  return item.translations.filter(
    (translation) =>
      !isDefaultLocale(translation.locale) &&
      (translation.title.trim() || translation.description.trim() || translation.meta.trim())
  ).length
}

function getAdditionalTranslationLabel(item: EqualityDocument) {
  const count = getAdditionalTranslationCount(item)
  if (count === 0) return ''
  return count > 1
    ? t('admin.equality.additionalLanguagesPlural', { count })
    : t('admin.equality.additionalLanguage', { count })
}

const saveOrder = async () => {
  try {
    await persistOrder()
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.equality.orderSavedToast'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.equality.orderErrorToast')),
      color: 'error',
    })
  }
}

const handleSubmit = async () => {
  const payload = buildPayload()

  if (editingItem.value && !hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createEqualityDocumentSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: EqualityDocument }>(
        `/api/admin/equality/${editingItem.value.id}`,
        {
          method: 'PUT',
          body: {
            ...payload,
            updatedAt: editingItem.value.updatedAt,
          },
        }
      )
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.equality.updatedToast'), color: 'success' })
    } else {
      const response = await $fetch<{ data: EqualityDocument }>('/api/admin/equality', {
        method: 'POST',
        body: payload,
      })
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.equality.createdToast'), color: 'success' })
    }

    closeModal()
    clearErrors()
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.equality.saveErrorToast')),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/equality/${itemToDelete.value.id}`, {
      method: 'DELETE',
    })
    removeItem(itemToDelete.value.id)
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.equality.deletedToast'), color: 'success' })
    closeDeleteModal()
  } catch {
    toast.add({ title: t('admin.equality.deleteErrorToast'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

const triggerPdfInput = () => {
  pdfInputRef.value?.click()
}

const handlePdfSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  pdfName.value = file.name
  isUploadingPdf.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)

    const result = await $fetch<{ path: string; storagePath: string }>(
      '/api/admin/equality/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    form.pdfUrl = result.storagePath
    toast.add({ title: t('admin.equality.pdfUploadedToast'), color: 'success' })
  } catch {
    pdfName.value = null
    toast.add({ title: t('admin.equality.pdfUploadFailedToast'), color: 'error' })
  } finally {
    isUploadingPdf.value = false
    target.value = ''
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.equality.title') }}</h1>
        <p class="text-muted mt-1 text-sm">
          {{ t('admin.equality.subtitle') }}
        </p>
      </div>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">{{
            t('admin.common.cancel')
          }}</UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">{{
            t('admin.common.saveOrder')
          }}</UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">{{
          t('admin.equality.newDocument')
        }}</UButton>
      </div>
    </div>

    <div v-if="pending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-24 w-full rounded-xl" />
      <USkeleton class="h-24 w-full rounded-xl" />
      <USkeleton class="h-24 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.equality.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <UCard v-else-if="items.length === 0" class="text-center">
      <div class="flex flex-col items-center gap-3 py-8">
        <UIcon name="i-tabler-files-off" class="text-muted size-10" />
        <p class="text-muted">{{ t('admin.equality.empty') }}</p>
        <UButton variant="soft" icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.equality.addFirst') }}
        </UButton>
      </div>
    </UCard>

    <div v-else ref="listRef" class="space-y-4">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface ring-default rounded-xl p-4 shadow-sm ring-1"
      >
        <div class="hidden items-start gap-4 md:flex">
          <div class="drag-handle flex cursor-grab items-center self-center active:cursor-grabbing">
            <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
          </div>

          <div class="min-w-0 flex-1 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-base leading-snug font-medium">
                {{ getDocumentTitle(item) }}
              </p>
              <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
              </UBadge>
            </div>

            <p v-if="getDocumentMeta(item)" class="text-muted text-sm">
              {{ getDocumentMeta(item) }}
            </p>

            <p class="text-muted text-sm break-all">{{ item.pdfUrl }}</p>

            <p v-if="getAdditionalTranslationCount(item) > 0" class="text-muted text-sm">
              {{ getAdditionalTranslationLabel(item) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              :href="item.pdfUrl"
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon="i-tabler-external-link"
            >
              {{ t('admin.equality.viewPdf') }}
            </UButton>
            <UButton icon="i-tabler-pencil" variant="ghost" @click="openEdit(item)">
              {{ t('admin.equality.edit') }}
            </UButton>
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              @click="confirmDelete(item)"
            >
              {{ t('admin.common.delete') }}
            </UButton>
          </div>
        </div>

        <div class="space-y-3 md:hidden">
          <div class="flex justify-center">
            <div class="drag-handle cursor-grab active:cursor-grabbing">
              <UIcon name="i-tabler-grip-horizontal" class="text-muted size-5" />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-base leading-snug font-medium">
                {{ getDocumentTitle(item) }}
              </p>
              <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
              </UBadge>
            </div>

            <p v-if="getDocumentMeta(item)" class="text-muted text-sm">
              {{ getDocumentMeta(item) }}
            </p>

            <p class="text-muted text-sm break-all">{{ item.pdfUrl }}</p>

            <p v-if="getAdditionalTranslationCount(item) > 0" class="text-muted text-sm">
              {{ getAdditionalTranslationLabel(item) }}
            </p>
          </div>

          <div class="flex flex-wrap gap-2">
            <UButton
              :href="item.pdfUrl"
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon="i-tabler-external-link"
            >
              {{ t('admin.equality.viewPdf') }}
            </UButton>
            <UButton icon="i-tabler-pencil" variant="ghost" @click="openEdit(item)">
              {{ t('admin.equality.edit') }}
            </UButton>
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              @click="confirmDelete(item)"
            >
              {{ t('admin.common.delete') }}
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UModal
      v-model:open="showModal"
      :title="editingItem ? t('admin.equality.editTitle') : t('admin.equality.newTitle')"
      :ui="{ content: 'sm:max-w-3xl' }"
    >
      <template #content>
        <div class="flex max-h-[85vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? t('admin.equality.editTitle') : t('admin.equality.newTitle') }}
            </h2>

            <form id="equality-form" class="space-y-4" @submit.prevent="handleSubmit">
              <div>
                <UFormField :label="t('admin.equality.statusLabel')">
                  <div class="flex items-center gap-2">
                    <USwitch v-model="form.active" />
                    <span class="text-sm">{{
                      form.active ? t('admin.common.active') : t('admin.common.inactive')
                    }}</span>
                  </div>
                </UFormField>
              </div>

              <UFormField :label="t('admin.equality.pdfLabel')" :error="getFieldError('pdfUrl')">
                <div class="space-y-3">
                  <input
                    ref="pdfInputRef"
                    type="file"
                    accept=".pdf"
                    class="hidden"
                    @change="handlePdfSelect"
                  />

                  <div
                    class="bg-muted/30 flex min-h-24 items-center justify-between gap-3 rounded-xl border p-4"
                  >
                    <div class="min-w-0">
                      <p class="font-medium">{{ t('admin.equality.currentFile') }}</p>
                      <p class="text-muted mt-1 text-sm break-all">
                        {{ pdfName || t('admin.equality.noPdfUploaded') }}
                      </p>
                    </div>

                    <UButton
                      type="button"
                      variant="outline"
                      icon="i-tabler-upload"
                      :loading="isUploadingPdf"
                      @click="triggerPdfInput"
                    >
                      {{
                        form.pdfUrl ? t('admin.equality.changePdf') : t('admin.equality.uploadPdf')
                      }}
                    </UButton>
                  </div>
                </div>
              </UFormField>

              <div
                v-for="(translation, index) in form.translations"
                :key="translation.locale"
                class="rounded-lg border p-4"
              >
                <h3 class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(translation.locale)" class="size-5" />
                  {{ getLocaleName(translation.locale) }}
                  <span v-if="!isDefaultLocale(translation.locale)" class="text-muted text-xs">
                    {{ t('admin.common.optional') }}
                  </span>
                </h3>

                <div class="space-y-3">
                  <UFormField
                    :label="
                      isDefaultLocale(translation.locale)
                        ? `${t('admin.equality.titleLabel')} *`
                        : t('admin.equality.titleLabel')
                    "
                    :error="getFieldError(`translations.${index}.title`)"
                  >
                    <UInput v-model="translation.title" class="w-full" />
                  </UFormField>

                  <UFormField
                    :label="
                      isDefaultLocale(translation.locale)
                        ? `${t('admin.equality.descriptionLabel')} *`
                        : t('admin.equality.descriptionLabel')
                    "
                    :error="getFieldError(`translations.${index}.description`)"
                  >
                    <UTextarea v-model="translation.description" :rows="4" class="w-full" />
                  </UFormField>

                  <UFormField :label="t('admin.equality.metaLabel')">
                    <UInput v-model="translation.meta" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </form>
          </div>

          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton
              type="submit"
              form="equality-form"
              :loading="isSubmitting"
              :disabled="Boolean(editingItem) && !hasFormChanges"
            >
              {{ editingItem ? t('admin.common.save') : t('admin.common.create') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" :title="t('admin.common.confirmDeleteTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.common.confirmDeleteTitle') }}</h2>
          </div>

          <p class="text-muted mb-6">
            {{
              t('admin.common.deleteConfirm', {
                name: getDocumentTitle(itemToDelete),
              })
            }}
          </p>

          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">{{
              t('admin.common.delete')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
