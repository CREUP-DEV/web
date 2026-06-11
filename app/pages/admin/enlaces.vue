<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createFeaturedLinkSchema } from '~~/shared/utils/adminSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Enlaces',
})

const {
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  filterNonEmptyTranslations,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()
const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const toast = useAdminToast()
const { refreshHomeData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

interface Translation {
  locale: string
  title: string
  alt: string
}

interface FeaturedLink {
  id: string
  image: string
  to: string
  order: number
  active: boolean
  updatedAt: string
  translations: Translation[]
}

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: FeaturedLink[]
}>('/api/admin/links', {
  headers: localeApiHeaders,
  lazy: true,
})

const sortFeaturedLinks = (left: FeaturedLink, right: FeaturedLink) => {
  if (left.order !== right.order) {
    return left.order - right.order
  }

  return left.id.localeCompare(right.id, 'es')
}

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data, {
  sortItems: sortFeaturedLinks,
})
const isSubmitting = ref(false)
const isDeleting = ref(false)

const form = reactive({
  image: '',
  to: '',
  order: 0,
  active: true,
  translations: createEmptyTranslations<Translation>({
    title: '',
    alt: '',
  }),
})

const buildPayload = () => ({
  image: form.image,
  to: form.to,
  order: form.order,
  active: form.active,
  translations: filterNonEmptyTranslations(form.translations, 'title'),
})

const buildPayloadSnapshot = () =>
  JSON.stringify({
    ...buildPayload(),
    translations: buildPayload().translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      alt: translation.alt,
    })),
  })

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

const currentImagePreview = computed(() => imagePreview.value || form.image || '')

const {
  inputRef: imageInputRef,
  preview: imagePreview,
  isUploading: isUploadingImage,
  triggerFileDialog: triggerImageUpload,
  handleFileSelect: handleImageSelect,
} = useAdminFileUpload({
  endpoint: '/api/admin/home/upload',
  extraFields: {
    kind: 'featured_link',
  },
  successMessage: t('admin.links.imageUploadSuccess'),
  errorMessage: t('admin.links.imageUploadError'),
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
} = useAdminCollectionState<FeaturedLink>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/links/reorder', {
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
    form.to = ''
    form.order = items.value.length
    form.active = true
    form.translations = createEmptyTranslations<Translation>({
      title: '',
      alt: '',
    })
    imagePreview.value = null
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.image = item.image
    form.to = item.to
    form.order = item.order
    form.active = item.active
    form.translations = mapTranslationsToForm(item.translations, {
      title: '',
      alt: '',
    }) as Translation[]
    imagePreview.value = item.image
    resetFormSnapshot()
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    await refreshHomeData()
    toast.add({
      title: t('admin.links.orderSaved'),
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.links.orderSaveError')),
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

  if (!validate(createFeaturedLinkSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: FeaturedLink }>(
        `/api/admin/links/${editingItem.value.id}`,
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
        title: t('admin.links.updateSuccess'),
        color: 'success',
      })
    } else {
      const response = await $fetch<{ data: FeaturedLink }>('/api/admin/links', {
        method: 'POST',
        body: payload,
      })
      replaceItem(response.data)
      await refreshHomeData()
      toast.add({
        title: t('admin.links.createSuccess'),
        color: 'success',
      })
    }
    closeModal()
    clearErrors()
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.links.saveError')),
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
    await $fetch(`/api/admin/links/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    closeDeleteModal()
    await refreshHomeData()
    toast.add({
      title: t('admin.links.deleteSuccess'),
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, t('admin.links.deleteError')),
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
      <h1 class="text-2xl font-bold">{{ t('admin.links.heading') }}</h1>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">
            {{ t('admin.common.cancel') }}
          </UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">
            {{ t('admin.common.saveOrder') }}
          </UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.common.add') }}
        </UButton>
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
        :title="t('admin.links.loadError')"
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
          <img
            :src="item.image"
            alt=""
            aria-hidden="true"
            class="h-16 w-16 rounded-lg object-cover"
            loading="lazy"
          />
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ item.translations[0]?.title }}</h3>
            <p class="text-muted truncate text-sm">{{ item.to }}</p>
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
              :aria-label="t('admin.links.editAriaLabel')"
              @click="openEdit(item)"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              :aria-label="t('admin.links.deleteAriaLabel')"
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
          <img
            :src="item.image"
            alt=""
            aria-hidden="true"
            class="mx-auto h-32 w-32 rounded-lg object-cover"
            loading="lazy"
          />
          <p class="text-muted text-sm break-all">{{ item.to }}</p>
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
                :aria-label="t('admin.links.editAriaLabel')"
                @click="openEdit(item)"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                :aria-label="t('admin.links.deleteAriaLabel')"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">{{ t('admin.links.emptyState') }}</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          {{ t('admin.links.addLink') }}
        </UButton>
      </div>
    </div>

    <UModal
      v-model:open="showModal"
      :title="editingItem ? t('admin.links.editTitle') : t('admin.links.createTitle')"
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? t('admin.links.editTitle') : t('admin.links.createTitle') }}
            </h2>

            <form id="links-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField :label="t('admin.links.imageLabel')" :error="getFieldError('image')">
                <div class="space-y-3">
                  <div
                    class="bg-muted/30 flex min-h-44 items-center justify-center overflow-hidden rounded-xl border p-4"
                  >
                    <img
                      v-if="currentImagePreview"
                      :src="currentImagePreview"
                      :alt="t('admin.links.imagePreviewAlt')"
                      class="max-h-24 max-w-full rounded-lg object-contain"
                    />
                    <p v-else class="text-muted px-4 text-center text-sm">
                      {{ t('admin.links.imagePlaceholder') }}
                    </p>
                  </div>

                  <input
                    ref="imageInputRef"
                    type="file"
                    accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
                    class="hidden"
                    @change="handleImageSelect"
                  />

                  <UButton
                    type="button"
                    variant="outline"
                    icon="i-tabler-upload"
                    :loading="isUploadingImage"
                    @click="triggerImageUpload"
                  >
                    {{ form.image ? t('admin.links.changeImage') : t('admin.links.uploadImage') }}
                  </UButton>

                  <p class="text-muted text-xs">
                    {{ t('admin.links.imageHint') }}
                  </p>
                </div>
              </UFormField>

              <UFormField :label="t('admin.links.urlLabel')" :error="getFieldError('to')">
                <UInput v-model="form.to" placeholder="https://..." class="w-full" />
              </UFormField>

              <UFormField :label="t('admin.links.statusLabel')">
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
                        ? `${t('admin.links.titleLabel')} *`
                        : t('admin.links.titleLabel')
                    "
                    :error="getFieldError(`translations.${index}.title`)"
                  >
                    <UInput v-model="trans.title" class="w-full" />
                  </UFormField>
                  <UFormField :label="t('admin.links.altLabel')">
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
              form="links-form"
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
