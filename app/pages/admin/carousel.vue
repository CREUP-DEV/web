<script setup lang="ts">
import { HOME_CAROUSEL_FALLBACK_IMAGE } from '~~/shared/constants/assetPaths'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createCarouselItemClientSchema } from '~~/shared/utils/adminClientSchemas'

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
  image: string
  href: string
  order: number
  active: boolean
  updatedAt: string
  translations: Translation[]
}

const toast = useToast()
const { clearErrors, getFieldError, validate } = useFormValidation()

const defaultCarouselImage = HOME_CAROUSEL_FALLBACK_IMAGE

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: CarouselItem[]
}>('/api/admin/carousel', {
  lazy: true,
})

const items = computed(() => data.value?.data ?? [])

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

const currentImagePreview = computed(() => imagePreview.value || form.image || defaultCarouselImage)

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
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
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

    await refresh()
  },
  prepareCreate: () => {
    clearErrors()
    form.image = ''
    form.href = ''
    form.order = items.value.length
    form.active = true
    form.translations = createEmptyTranslations<Translation>(emptyTranslation)
    imagePreview.value = null
  },
  prepareEdit: (item) => {
    clearErrors()
    form.image = item.image
    form.href = item.href
    form.order = item.order
    form.active = item.active
    form.translations = mapTranslationsToForm(item.translations, emptyTranslation) as Translation[]
    imagePreview.value = item.image
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    toast.add({
      title: 'Orden del carrusel guardado',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo guardar el orden del carrusel'),
      color: 'error',
    })
  }
}

const handleSubmit = async () => {
  const payload = {
    ...form,
    image: form.image.trim() || defaultCarouselImage,
    href: form.href.trim(),
  }

  if (!validate(createCarouselItemClientSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await $fetch(`/api/admin/carousel/${editingItem.value.id}`, {
        method: 'PUT',
        body: {
          ...payload,
          updatedAt: editingItem.value.updatedAt,
        },
      })
      toast.add({
        title: 'Elemento del carrusel actualizado',
        color: 'success',
      })
    } else {
      await $fetch('/api/admin/carousel', {
        method: 'POST',
        body: payload,
      })
      toast.add({
        title: 'Elemento del carrusel creado',
        color: 'success',
      })
    }
    closeModal()
    clearErrors()
    await refresh()
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo guardar el elemento del carrusel'),
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
    closeDeleteModal()
    await refresh()
    toast.add({
      title: 'Elemento del carrusel eliminado',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo eliminar el elemento del carrusel'),
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
      <h1 class="text-2xl font-bold">Carrusel</h1>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">Cancelar</UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">Guardar orden</UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
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
        title="No se pudieron cargar los elementos del carrusel"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
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
              :src="item.image || defaultCarouselImage"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              loading="lazy"
            />
          </div>
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ item.translations[0]?.title }}</h3>
            <p class="text-muted truncate text-sm">{{ item.href }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span
                :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
                class="rounded-full px-2 py-0.5 text-xs"
              >
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton
              icon="i-tabler-pencil"
              variant="ghost"
              size="sm"
              aria-label="Editar elemento del carrusel"
              @click="openEdit(item)"
            />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
              aria-label="Eliminar elemento del carrusel"
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
              :src="item.image || defaultCarouselImage"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              loading="lazy"
            />
          </div>
          <p class="text-muted text-sm break-all">{{ item.href }}</p>
          <div class="flex items-center justify-between">
            <span
              :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.active ? 'Activo' : 'Inactivo' }}
            </span>
            <div class="flex gap-2">
              <UButton
                icon="i-tabler-pencil"
                variant="ghost"
                size="sm"
                aria-label="Editar elemento del carrusel"
                @click="openEdit(item)"
              />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                aria-label="Eliminar elemento del carrusel"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">No hay elementos en el carrusel todavía.</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          Añadir elemento
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar elemento' : 'Nuevo elemento' }}
            </h2>

            <form id="carousel-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Imagen (opcional)" :error="getFieldError('image')">
                <div class="space-y-3">
                  <div class="bg-muted aspect-1925/550 overflow-hidden rounded-xl border">
                    <img
                      :src="currentImagePreview"
                      alt="Vista previa del banner"
                      class="size-full object-cover"
                    />
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
                      {{ form.image ? 'Cambiar imagen' : 'Subir imagen' }}
                    </UButton>
                  </div>

                  <p class="text-muted text-xs">
                    Si no subes una imagen, se usará la predeterminada. Tamaño recomendado: 1925 ×
                    550 px.
                  </p>
                </div>
              </UFormField>

              <UFormField label="Enlace" :error="getFieldError('href')">
                <UInput v-model="form.href" placeholder="/pagina" class="w-full" />
              </UFormField>

              <UFormField label="Estado">
                <div class="flex items-center gap-2">
                  <USwitch v-model="form.active" />
                  <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
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
                    (opcional)
                  </span>
                </h4>
                <div class="space-y-3">
                  <UFormField
                    :label="isDefaultLocale(trans.locale) ? 'Título *' : 'Título'"
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
                    :label="isDefaultLocale(trans.locale) ? 'Texto del botón *' : 'Texto del botón'"
                  >
                    <UInput
                      v-model="trans.buttonText"
                      class="w-full"
                      :required="isDefaultLocale(trans.locale)"
                    />
                  </UFormField>
                  <UFormField label="Texto alternativo (descripción de la imagen)">
                    <UInput v-model="trans.alt" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" form="carousel-form" :loading="isSubmitting">
              {{ editingItem ? 'Guardar' : 'Crear' }}
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
            <h2 class="text-lg font-bold">Confirmar eliminación</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Estás seguro de que deseas eliminar "{{ itemToDelete?.translations[0]?.title }}"? Esta
            acción no se puede deshacer.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">Cancelar</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">Eliminar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
