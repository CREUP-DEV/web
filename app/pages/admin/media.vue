<script setup lang="ts">
definePageMeta({
  layout: 'admin',
})

const toast = useToast()

interface MediaOutlet {
  id: string
  name: string
  website: string
  logo: string
  order: number
}

const { data, refresh } = await useFetch<{ items: MediaOutlet[] }>('/api/admin/media')

const items = computed(() => data.value?.items ?? [])

const showModal = ref(false)
const editingItem = ref<MediaOutlet | null>(null)
const isSubmitting = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<MediaOutlet | null>(null)
const isDeleting = ref(false)

const form = reactive({
  name: '',
  website: '',
  logo: '',
  order: 0,
})

const listRef = ref<HTMLElement | null>(null)
const { localItems, hasOrderChanges, isSavingOrder, persistOrder, cancelOrderChanges } =
  useReorderableAdminList({
    items,
    listRef,
    persist: async (updates) => {
      await $fetch('/api/admin/media/reorder', {
        method: 'POST',
        body: { items: updates },
      })

      await refresh()
    },
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

const saveOrder = async () => {
  try {
    await persistOrder()
    toast.add({ title: 'Orden guardado', color: 'success' })
  } catch (e) {
    console.error('Error saving order:', e)
    toast.add({ title: 'No se pudo guardar el orden', color: 'error' })
  }
}

const openCreate = () => {
  editingItem.value = null
  form.name = ''
  form.website = ''
  form.logo = ''
  form.order = items.value.length
  logoPreview.value = null
  showModal.value = true
}

const openEdit = (item: MediaOutlet) => {
  editingItem.value = item
  form.name = item.name
  form.website = item.website
  form.logo = item.logo
  form.order = item.order
  logoPreview.value = item.logo
  showModal.value = true
}

const handleSubmit = async () => {
  if (!form.logo) {
    toast.add({ title: 'El logo es obligatorio', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      name: form.name,
      website: form.website,
      logo: form.logo,
      order: form.order,
    }

    if (editingItem.value) {
      await $fetch(`/api/admin/media/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({ title: 'Medio actualizado', color: 'success' })
    } else {
      await $fetch('/api/admin/media', {
        method: 'POST',
        body: payload,
      })
      toast.add({ title: 'Medio creado', color: 'success' })
    }
    showModal.value = false
    await refresh()
  } catch (e) {
    console.error('Error saving:', e)
    toast.add({ title: 'No se pudo guardar el medio', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: MediaOutlet) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/media/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Medio eliminado', color: 'success' })
  } catch (e) {
    console.error('Error deleting:', e)
    toast.add({ title: 'No se pudo eliminar el medio', color: 'error' })
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

    <div ref="listRef" class="space-y-4">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
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

      <div v-if="!localItems.length" class="text-muted py-12 text-center">
        No hay medios de comunicación
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
              <UFormField label="Nombre">
                <UInput v-model="form.name" placeholder="Nombre del medio" class="w-full" />
              </UFormField>

              <UFormField label="Web">
                <UInput v-model="form.website" placeholder="https://..." class="w-full" />
              </UFormField>

              <UFormField label="Logo">
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
