<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createMediaOutletClientSchema } from '~~/shared/utils/adminClientSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Medios',
})

const toast = useToast()
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
  lazy: true,
})

const items = computed(() => data.value?.data ?? [])
const isSubmitting = ref(false)
const isDeleting = ref(false)

const form = reactive({
  name: '',
  website: '',
  logo: '',
  order: 0,
})

const {
  inputRef: fileInputRef,
  preview: logoPreview,
  isUploading,
  triggerFileDialog: triggerFileInput,
  handleFileSelect,
} = useAdminFileUpload({
  endpoint: '/api/admin/media/upload',
  successMessage: 'Logo subido correctamente',
  errorMessage: 'No se pudo subir el logo',
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

    await refresh()
  },
  prepareCreate: () => {
    clearErrors()
    form.name = ''
    form.website = ''
    form.logo = ''
    form.order = items.value.length
    logoPreview.value = null
  },
  prepareEdit: (item) => {
    clearErrors()
    form.name = item.name
    form.website = item.website
    form.logo = item.logo
    form.order = item.order
    logoPreview.value = item.logo
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    toast.add({ title: 'Orden guardado', color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'No se pudo guardar el orden'), color: 'error' })
  }
}

const handleSubmit = async () => {
  const payload = {
    name: form.name,
    website: form.website,
    logo: form.logo,
    order: form.order,
  }

  if (!validate(createMediaOutletClientSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await $fetch(`/api/admin/media/${editingItem.value.id}`, {
        method: 'PUT',
        body: {
          ...payload,
          updatedAt: editingItem.value.updatedAt,
        },
      })
      toast.add({ title: 'Medio actualizado', color: 'success' })
    } else {
      await $fetch('/api/admin/media', {
        method: 'POST',
        body: payload,
      })
      toast.add({ title: 'Medio creado', color: 'success' })
    }
    closeModal()
    clearErrors()
    await refresh()
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'No se pudo guardar el medio'), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/media/${itemToDelete.value.id}`, { method: 'DELETE' })
    closeDeleteModal()
    await refresh()
    toast.add({ title: 'Medio eliminado', color: 'success' })
  } catch (e) {
    toast.add({ title: getApiErrorMessage(e, 'No se pudo eliminar el medio'), color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Medios de comunicación</h1>
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
        title="No se pudieron cargar los medios"
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
            :src="item.logo"
            :alt="`Logo de ${item.name}`"
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
          <h3 class="font-medium">{{ item.name }}</h3>
          <img
            :src="item.logo"
            :alt="`Logo de ${item.name}`"
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

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">No hay medios de comunicación todavía.</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          Añadir medio
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-lg' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar medio' : 'Nuevo medio' }}
            </h2>

            <form id="media-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Nombre" :error="getFieldError('name')">
                <UInput v-model="form.name" placeholder="Nombre del medio" class="w-full" />
              </UFormField>

              <UFormField label="Web" :error="getFieldError('website')">
                <UInput v-model="form.website" placeholder="https://..." class="w-full" />
              </UFormField>

              <UFormField label="Logo" :error="getFieldError('logo')">
                <div class="space-y-3">
                  <div
                    v-if="logoPreview"
                    class="bg-muted/30 flex items-center justify-center rounded-lg border p-4"
                  >
                    <img
                      :src="logoPreview"
                      alt="Vista previa del logo"
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
                    {{ logoPreview ? 'Cambiar logo' : 'Subir logo' }}
                  </UButton>
                </div>
              </UFormField>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" form="media-form" :loading="isSubmitting">
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
            ¿Estás seguro de que deseas eliminar "{{ itemToDelete?.name }}"? Esta acción no se puede
            deshacer.
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
