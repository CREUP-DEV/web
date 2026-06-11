<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createMediaOutletSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Medios',
})

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

interface MediaOutlet {
  id: string
  name: string
  website: string
  logo: string
  order: number
  updatedAt: string
}

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: MediaOutlet[]
}>('/api/admin/media', {
  headers: localeApiHeaders,
  lazy: true,
})

const sortMediaOutlets = (left: MediaOutlet, right: MediaOutlet) => {
  if (left.order !== right.order) {
    return left.order - right.order
  }

  return left.id.localeCompare(right.id, 'es')
}

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data, {
  sortItems: sortMediaOutlets,
})
const isSubmitting = ref(false)
const isDeleting = ref(false)

const form = reactive({
  name: '',
  website: '',
  logo: '',
  order: 0,
})

const buildPayload = () => ({
  name: form.name,
  website: form.website,
  logo: form.logo,
  order: form.order,
})

const buildPayloadSnapshot = () => JSON.stringify(buildPayload())

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

const {
  inputRef: fileInputRef,
  preview: logoPreview,
  isUploading,
  triggerFileDialog: triggerFileInput,
  handleFileSelect,
} = useAdminFileUpload({
  endpoint: '/api/admin/media/upload',
  successMessage: t('admin.media.logoUploaded'),
  errorMessage: t('admin.media.logoUploadFailed'),
  onUploaded: (storagePath) => {
    form.logo = storagePath
  },
  getFallbackPreview: () => form.logo || null,
})

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
} = useAdminCollectionState<MediaOutlet>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/media/reorder', {
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
    form.name = ''
    form.website = ''
    form.logo = ''
    form.order = items.value.length
    logoPreview.value = null
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.name = item.name
    form.website = item.website
    form.logo = item.logo
    form.order = item.order
    logoPreview.value = item.logo
    resetFormSnapshot()
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    await refreshAllClientAsyncData()
    toast.add({ title: t('admin.media.orderSavedToast'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, t('admin.media.orderErrorToast')), color: 'error' })
  }
}

const handleSubmit = async () => {
  const payload = buildPayload()

  if (editingItem.value && !hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createMediaOutletSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: MediaOutlet }>(
        `/api/admin/media/${editingItem.value.id}`,
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
      toast.add({ title: t('admin.media.updatedToast'), color: 'success' })
    } else {
      const response = await $fetch<{ data: MediaOutlet }>('/api/admin/media', {
        method: 'POST',
        body: payload,
      })
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.media.createdToast'), color: 'success' })
    }
    closeModal()
    clearErrors()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, t('admin.media.saveErrorToast')), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/media/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({ title: t('admin.media.deletedToast'), color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, t('admin.media.deleteErrorToast')), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('admin.media.title') }}</h1>
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
          t('admin.common.add')
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
        :title="t('admin.media.loadErrorTitle')"
        :description="t('admin.media.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else ref="listRef" class="space-y-4">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface ring-default rounded-xl p-4 shadow-sm ring-1"
      >
        <div class="hidden items-center gap-4 md:flex">
          <div class="drag-handle cursor-grab active:cursor-grabbing">
            <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
          </div>
          <img
            :src="item.logo"
            :alt="t('admin.media.logoAlt', { name: item.name })"
            class="h-12 w-20 rounded-lg border object-contain p-1"
          />
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ item.name }}</h3>
            <a
              :href="item.website"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary truncate text-sm hover:underline"
            >
              {{ item.website }}
            </a>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-tabler-pencil"
              variant="ghost"
              size="sm"
              :aria-label="t('admin.media.editAria')"
              @click="openEdit(item)"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('admin.media.deleteAria')"
              @click="confirmDelete(item)"
            />
          </div>
        </div>

        <div class="space-y-3 md:hidden">
          <div class="flex justify-center">
            <div class="drag-handle cursor-grab active:cursor-grabbing">
              <UIcon name="i-tabler-grip-horizontal" class="text-muted size-5" />
            </div>
          </div>
          <h3 class="font-medium">{{ item.name }}</h3>
          <img
            :src="item.logo"
            :alt="t('admin.media.logoAlt', { name: item.name })"
            class="mx-auto h-16 w-28 rounded-lg border object-contain p-1"
          />
          <a
            :href="item.website"
            target="_blank"
            rel="noopener noreferrer"
            class="text-primary block text-sm break-all hover:underline"
          >
            {{ item.website }}
          </a>
          <div class="flex justify-end gap-2">
            <UButton
              icon="i-tabler-pencil"
              variant="ghost"
              size="sm"
              :aria-label="t('admin.media.editAria')"
              @click="openEdit(item)"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('admin.media.deleteAria')"
              @click="confirmDelete(item)"
            />
          </div>
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">{{ t('admin.media.empty') }}</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.media.addItem') }}
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="showModal"
      :title="editingItem ? t('admin.media.editTitle') : t('admin.media.newTitle')"
      :ui="{ content: 'sm:max-w-lg' }"
    >
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? t('admin.media.editTitle') : t('admin.media.newTitle') }}
            </h2>

            <form id="media-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField :label="t('admin.media.nameLabel')" :error="getFieldError('name')">
                <UInput
                  v-model="form.name"
                  :placeholder="t('admin.media.namePlaceholder')"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="t('admin.media.websiteLabel')" :error="getFieldError('website')">
                <UInput
                  v-model="form.website"
                  :placeholder="t('admin.media.websitePlaceholder')"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="t('admin.media.logoLabel')" :error="getFieldError('logo')">
                <div class="space-y-3">
                  <div
                    v-if="logoPreview"
                    class="bg-muted/30 flex items-center justify-center rounded-lg border p-4"
                  >
                    <img
                      :src="logoPreview"
                      :alt="t('admin.media.logoPreviewAlt')"
                      class="max-h-32 max-w-full object-contain"
                    />
                  </div>

                  <input
                    ref="fileInputRef"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                    class="hidden"
                    @change="handleFileSelect"
                  />
                  <UButton
                    type="button"
                    variant="outline"
                    icon="i-tabler-upload"
                    :loading="isUploading"
                    @click="triggerFileInput"
                  >
                    {{ logoPreview ? t('admin.media.changeLogo') : t('admin.media.uploadLogo') }}
                  </UButton>
                </div>
              </UFormField>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton
              type="submit"
              form="media-form"
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
            {{ t('admin.media.deleteConfirm', { name: itemToDelete?.name }) }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">
              {{ t('admin.common.delete') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
