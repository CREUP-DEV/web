<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createCarouselItemSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Carrusel',
})

interface Translation {
  locale: string
  title: string
  buttonText: string
  alt: string
}

interface CarouselItem {
  id: string
  image: string | null
  href: string
  order: number
  active: boolean
  updatedAt: string
  translations: Translation[]
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshHomeData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

const { data: siteDefaultImagesData } = await useFetch<{
  data: { carouselSlideImage: string | null }
}>('/api/admin/site-default-images', { headers: localeApiHeaders, lazy: true })

const siteDefaultSlide = computed(
  () => siteDefaultImagesData.value?.data?.carouselSlideImage ?? null
)

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: CarouselItem[]
}>('/api/admin/carousel', {
  headers: localeApiHeaders,
  lazy: true,
})

const sortCarouselItems = (left: CarouselItem, right: CarouselItem) => {
  if (left.order !== right.order) {
    return left.order - right.order
  }

  return left.id.localeCompare(right.id, 'es')
}

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data, {
  sortItems: sortCarouselItems,
})

const {
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const isSubmitting = ref(false)
const isDeleting = ref(false)

const emptyTranslation = { title: '', buttonText: '', alt: '' }
const form = reactive({
  image: '',
  href: '',
  order: 0,
  active: true,
  translations: createEmptyTranslations<Translation>(emptyTranslation),
})

const buildPayload = () => ({
  ...form,
  image: form.image.trim() || null,
  href: form.href.trim(),
  translations: form.translations.map((translation) => ({
    locale: translation.locale,
    title: translation.title,
    buttonText: translation.buttonText,
    alt: translation.alt,
  })),
})

const buildPayloadSnapshot = () => JSON.stringify(buildPayload())

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

const currentImagePreview = computed(
  () => imagePreview.value || form.image || siteDefaultSlide.value
)

const {
  inputRef: imageInputRef,
  preview: imagePreview,
  isUploading: isUploadingImage,
  triggerFileDialog: triggerImageUpload,
  handleFileSelect: handleImageSelect,
} = useAdminFileUpload({
  endpoint: '/api/admin/home/upload',
  extraFields: {
    kind: 'carousel',
  },
  successMessage: t('admin.carousel.imageUploaded'),
  errorMessage: t('admin.carousel.imageUploadFailed'),
  onUploaded: (storagePath) => {
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
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
} = useAdminCollectionState<CarouselItem>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/carousel/reorder', {
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
    form.image = ''
    form.href = ''
    form.order = items.value.length
    form.active = true
    form.translations = createEmptyTranslations<Translation>(emptyTranslation)
    imagePreview.value = null
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.image = item.image ?? ''
    form.href = item.href
    form.order = item.order
    form.active = item.active
    form.translations = mapTranslationsToForm(item.translations, emptyTranslation) as Translation[]
    imagePreview.value = item.image ?? null
    resetFormSnapshot()
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    await refreshHomeData()
    toast.add({
      title: t('admin.carousel.orderSavedToast'),
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.carousel.orderErrorToast')),
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

  if (!validate(createCarouselItemSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: CarouselItem }>(
        `/api/admin/carousel/${editingItem.value.id}`,
        {
          method: 'PUT',
          body: {
            ...payload,
            updatedAt: editingItem.value.updatedAt,
          },
        }
      )
      replaceItem(response.data)
      await refreshHomeData()
      toast.add({
        title: t('admin.carousel.updatedToast'),
        color: 'success',
      })
    } else {
      const response = await $fetch<{ data: CarouselItem }>('/api/admin/carousel', {
        method: 'POST',
        body: payload,
      })
      replaceItem(response.data)
      await refreshHomeData()
      toast.add({
        title: t('admin.carousel.createdToast'),
        color: 'success',
      })
    }
    closeModal()
    clearErrors()
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.carousel.saveErrorToast')),
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
    await $fetch(`/api/admin/carousel/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    closeDeleteModal()
    await refreshHomeData()
    toast.add({
      title: t('admin.carousel.deletedToast'),
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.carousel.deleteErrorToast')),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('admin.carousel.title') }}</h1>
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
        :title="t('admin.carousel.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
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
          <div class="bg-muted aspect-1925/550 w-40 max-w-40 overflow-hidden rounded-lg">
            <img
              v-if="item.image || siteDefaultSlide"
              :src="(item.image || siteDefaultSlide) as string"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              loading="lazy"
            />
            <div v-else class="bg-muted size-full min-h-24" aria-hidden="true" />
          </div>
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ item.translations[0]?.title }}</h3>
            <p class="text-muted truncate text-sm">{{ item.href }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span
                :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
                class="rounded-full px-2 py-0.5 text-xs"
              >
                {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-tabler-pencil"
              variant="ghost"
              size="sm"
              :aria-label="t('admin.carousel.editAria')"
              @click="openEdit(item)"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('admin.carousel.deleteAria')"
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
          <h3 class="wrap-break-words font-medium">{{ item.translations[0]?.title }}</h3>
          <div class="bg-muted aspect-1925/550 w-full overflow-hidden rounded-lg">
            <img
              v-if="item.image || siteDefaultSlide"
              :src="(item.image || siteDefaultSlide) as string"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              loading="lazy"
            />
            <div v-else class="bg-muted size-full min-h-24" aria-hidden="true" />
          </div>
          <p class="text-muted text-sm break-all">{{ item.href }}</p>
          <div class="flex items-center justify-between">
            <span
              :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.active ? t('admin.common.active') : t('admin.common.inactive') }}
            </span>
            <div class="flex gap-2">
              <UButton
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                :aria-label="t('admin.carousel.editAria')"
                @click="openEdit(item)"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :aria-label="t('admin.carousel.deleteAria')"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">{{ t('admin.carousel.empty') }}</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.carousel.addItem') }}
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? t('admin.carousel.editTitle') : t('admin.carousel.newTitle') }}
            </h2>

            <form id="carousel-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField :label="t('admin.carousel.imageLabel')" :error="getFieldError('image')">
                <div class="space-y-3">
                  <div class="bg-muted aspect-1925/550 overflow-hidden rounded-xl border">
                    <img
                      v-if="currentImagePreview"
                      :src="currentImagePreview"
                      :alt="t('admin.carousel.imagePreviewAlt')"
                      class="size-full object-cover"
                    />
                    <div
                      v-else
                      class="text-muted flex size-full min-h-32 items-center justify-center text-sm"
                    >
                      {{ t('admin.carousel.noImage') }}
                    </div>
                  </div>

                  <input
                    ref="imageInputRef"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                    class="hidden"
                    @change="handleImageSelect"
                  />

                  <div class="flex flex-wrap gap-2">
                    <UButton
                      type="button"
                      variant="outline"
                      icon="i-tabler-upload"
                      :loading="isUploadingImage"
                      @click="triggerImageUpload"
                    >
                      {{
                        form.image
                          ? t('admin.carousel.changeImage')
                          : t('admin.carousel.uploadImage')
                      }}
                    </UButton>
                  </div>

                  <p class="text-muted text-xs">{{ t('admin.carousel.recommendedSize') }}</p>
                </div>
              </UFormField>

              <UFormField :label="t('admin.carousel.linkLabel')" :error="getFieldError('href')">
                <UInput
                  v-model="form.href"
                  :placeholder="t('admin.carousel.linkPlaceholder')"
                  class="w-full"
                />
              </UFormField>

              <UFormField :label="t('admin.carousel.statusLabel')">
                <div class="flex items-center gap-2">
                  <USwitch v-model="form.active" />
                  <span class="text-sm">{{
                    form.active ? t('admin.common.active') : t('admin.common.inactive')
                  }}</span>
                </div>
              </UFormField>

              <div
                v-for="(trans, index) in form.translations"
                :key="trans.locale"
                class="rounded-lg border p-4"
              >
                <h4 class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
                  {{ getLocaleName(trans.locale) }}
                  <span v-if="!isDefaultLocale(trans.locale)" class="text-muted text-xs">
                    {{ t('admin.common.optional') }}
                  </span>
                </h4>
                <div class="space-y-3">
                  <UFormField
                    :label="
                      isDefaultLocale(trans.locale)
                        ? `${t('admin.carousel.titleLabel')} *`
                        : t('admin.carousel.titleLabel')
                    "
                    :error="getFieldError(`translations.${index}.title`)"
                  >
                    <UTextarea
                      v-model="trans.title"
                      :rows="2"
                      class="w-full"
                      :required="isDefaultLocale(trans.locale)"
                    />
                  </UFormField>
                  <UFormField
                    :label="
                      isDefaultLocale(trans.locale)
                        ? `${t('admin.carousel.buttonTextLabel')} *`
                        : t('admin.carousel.buttonTextLabel')
                    "
                  >
                    <UInput
                      v-model="trans.buttonText"
                      class="w-full"
                      :required="isDefaultLocale(trans.locale)"
                    />
                  </UFormField>
                  <UFormField :label="t('admin.carousel.altLabel')">
                    <UInput v-model="trans.alt" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">
              {{ t('admin.common.cancel') }}
            </UButton>
            <UButton
              type="submit"
              form="carousel-form"
              :loading="isSubmitting"
              :disabled="Boolean(editingItem) && !hasFormChanges"
            >
              {{ editingItem ? t('admin.common.save') : t('admin.common.create') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal">
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
                name: itemToDelete?.translations[0]?.title,
              })
            }}
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
