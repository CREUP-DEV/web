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
const toast = useToast()
const { clearErrors, getFieldError, validate } = useZodFormValidation()

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
  translations: Translation[]
}

const {
  data,
  error: fetchError,
  refresh,
} = await useFetch<{ items: FeaturedLink[] }>('/api/admin/links')

const items = computed(() => data.value?.items ?? [])
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
} = useAdminCollectionState<FeaturedLink>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/links/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
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
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    toast.add({
      title: 'Orden de enlaces guardado',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo guardar el orden de enlaces'),
      color: 'error',
    })
  }
}

const handleSubmit = async () => {
  const payload = {
    image: form.image,
    to: form.to,
    order: form.order,
    active: form.active,
    translations: filterNonEmptyTranslations(form.translations, 'title'),
  }

  if (!validate(createFeaturedLinkSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await $fetch(`/api/admin/links/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({
        title: 'Enlace actualizado',
        color: 'success',
      })
    } else {
      await $fetch('/api/admin/links', {
        method: 'POST',
        body: payload,
      })
      toast.add({
        title: 'Enlace creado',
        color: 'success',
      })
    }
    closeModal()
    clearErrors()
    await refresh()
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo guardar el enlace'),
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
    closeDeleteModal()
    await refresh()
    toast.add({
      title: 'Enlace eliminado',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo eliminar el enlace'),
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
      <h1 class="text-2xl font-bold">Enlaces destacados</h1>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">Cancelar</UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">Guardar orden</UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
      </div>
    </div>

    <div v-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudieron cargar los enlaces"
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
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </span>
            </div>
          </div>
          <div class="flex gap-2">
            <UButton icon="i-tabler-pencil" variant="ghost" size="sm" @click="openEdit(item)" />
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              size="sm"
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
              {{ item.active ? 'Activo' : 'Inactivo' }}
            </span>
            <div class="flex gap-2">
              <UButton icon="i-tabler-pencil" variant="ghost" size="sm" @click="openEdit(item)" />
              <UButton
                icon="i-tabler-trash"
                variant="ghost"
                color="error"
                size="sm"
                @click="confirmDelete(item)"
              />
            </div>
          </div>
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">No hay enlaces destacados todavía.</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          Añadir enlace
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar enlace' : 'Nuevo enlace' }}
            </h2>

            <form id="links-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Imagen" :error="getFieldError('image')">
                <div class="space-y-3">
                  <div
                    class="bg-muted/30 flex min-h-44 items-center justify-center overflow-hidden rounded-xl border p-4"
                  >
                    <img
                      v-if="currentImagePreview"
                      :src="currentImagePreview"
                      alt="Vista previa de la imagen del enlace"
                      class="max-h-24 max-w-full rounded-lg object-contain"
                    />
                    <p v-else class="text-muted px-4 text-center text-sm">
                      Sube una imagen cuadrada para el enlace destacado.
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
                    {{ form.image ? 'Cambiar imagen' : 'Subir imagen' }}
                  </UButton>

                  <p class="text-muted text-xs">
                    Formato recomendado: cuadrado. La vista previa se muestra reducida para evitar
                    ampliaciones engañosas.
                  </p>
                </div>
              </UFormField>

              <UFormField label="Enlace (URL)" :error="getFieldError('to')">
                <UInput v-model="form.to" placeholder="https://..." class="w-full" />
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
                </h4>
                <div class="space-y-3">
                  <UFormField
                    :label="`Título ${!isDefaultLocale(trans.locale) ? '(opcional)' : ''}`"
                    :error="getFieldError(`translations.${index}.title`)"
                  >
                    <UInput v-model="trans.title" class="w-full" />
                  </UFormField>
                  <UFormField
                    :label="`Texto alternativo ${!isDefaultLocale(trans.locale) ? '(opcional)' : ''}`"
                  >
                    <UInput v-model="trans.alt" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" form="links-form" :loading="isSubmitting">
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
