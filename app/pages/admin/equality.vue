<script setup lang="ts">
import Sortable from 'sortablejs'

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
  translations: EqualityDocumentTranslation[]
}

const toast = useToast()
const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const { data, refresh } = await useFetch<{ items: EqualityDocument[] }>('/api/admin/equality')
const items = computed(() => data.value?.items ?? [])
const localItems = ref<EqualityDocument[]>([])
const isSavingOrder = ref(false)

const hasOrderChanges = computed(() => {
  if (localItems.value.length !== items.value.length) return false
  return localItems.value.some((item, index) => item.id !== items.value[index]?.id)
})

watch(
  items,
  (newItems: EqualityDocument[]) => {
    localItems.value = [...newItems]
  },
  { immediate: true }
)

const showModal = ref(false)
const editingItem = ref<EqualityDocument | null>(null)
const isSubmitting = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<EqualityDocument | null>(null)
const isDeleting = ref(false)

const pdfInputRef = ref<HTMLInputElement | null>(null)
const pdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)
const listRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

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

const initializeSortable = (element: HTMLElement | null) => {
  sortableInstance?.destroy()
  sortableInstance = null

  if (!element) return

  sortableInstance = Sortable.create(element, {
    animation: 150,
    handle: '.drag-handle',
    ghostClass: 'opacity-50',
    onEnd: (event) => {
      if (event.oldIndex === undefined || event.newIndex === undefined) return

      const movedItem = localItems.value.splice(event.oldIndex, 1)[0]
      if (movedItem) {
        localItems.value.splice(event.newIndex, 0, movedItem)
      }
    },
  })
}

watch(listRef, (element) => {
  initializeSortable(element)
})

onUnmounted(() => {
  sortableInstance?.destroy()
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
  return `${count} idioma adicional${count > 1 ? 'es' : ''}`
}

const openCreate = () => {
  editingItem.value = null
  form.pdfUrl = ''
  form.order = items.value.length
  form.active = true
  form.translations = createEmptyTranslationSet()
  pdfName.value = null
  showModal.value = true
}

const openEdit = (item: EqualityDocument) => {
  editingItem.value = item
  form.pdfUrl = item.pdfUrl
  form.order = item.order
  form.active = item.active
  form.translations = mapTranslationsToForm(item.translations, {
    title: '',
    description: '',
    meta: '',
  }) as EqualityDocumentTranslation[]
  pdfName.value = item.pdfUrl.split('/').pop() ?? null
  showModal.value = true
}

const saveOrder = async () => {
  isSavingOrder.value = true
  try {
    const updates = localItems.value.map((item, index) => ({
      id: item.id,
      order: index,
    }))

    await $fetch('/api/admin/equality/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
    toast.add({ title: 'Orden guardado', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo guardar el orden', color: 'error' })
  } finally {
    isSavingOrder.value = false
  }
}

const cancelOrderChanges = () => {
  localItems.value = [...items.value]
}

const handleSubmit = async () => {
  const defaultTranslation = form.translations.find((translation) =>
    isDefaultLocale(translation.locale)
  )

  if (!defaultTranslation?.title.trim()) {
    toast.add({ title: 'El título en español es obligatorio', color: 'error' })
    return
  }

  if (!defaultTranslation.description.trim()) {
    toast.add({ title: 'La descripción en español es obligatoria', color: 'error' })
    return
  }

  if (!form.pdfUrl) {
    toast.add({ title: 'Debes subir un PDF', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      pdfUrl: form.pdfUrl,
      order: form.order,
      active: form.active,
      translations: form.translations,
    }

    if (editingItem.value) {
      await $fetch(`/api/admin/equality/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({ title: 'Documento actualizado', color: 'success' })
    } else {
      await $fetch('/api/admin/equality', {
        method: 'POST',
        body: payload,
      })
      toast.add({ title: 'Documento creado', color: 'success' })
    }

    showModal.value = false
    await refresh()
  } catch {
    toast.add({ title: 'No se pudo guardar el documento', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: EqualityDocument) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/equality/${itemToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Documento eliminado', color: 'success' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
  } catch {
    toast.add({ title: 'No se pudo eliminar el documento', color: 'error' })
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
    toast.add({ title: 'PDF subido correctamente', color: 'success' })
  } catch {
    pdfName.value = null
    toast.add({ title: 'No se pudo subir el PDF', color: 'error' })
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
        <h1 class="text-2xl font-bold">Igualdad</h1>
        <p class="text-muted mt-1 text-sm">
          Gestiona los documentos públicos y el contenido de sus tarjetas.
        </p>
      </div>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">Cancelar</UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">Guardar orden</UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">Nuevo documento</UButton>
      </div>
    </div>

    <UCard v-if="items.length === 0" class="text-center">
      <div class="flex flex-col items-center gap-3 py-8">
        <UIcon name="i-tabler-files-off" class="text-muted size-10" />
        <p class="text-muted">No hay documentos de igualdad todavía.</p>
        <UButton variant="soft" icon="i-tabler-plus" @click="openCreate">
          Añadir primer documento
        </UButton>
      </div>
    </UCard>

    <div v-else ref="listRef" class="space-y-4">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
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
                {{ item.active ? 'Activo' : 'Inactivo' }}
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
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon="i-tabler-external-link"
            >
              Ver PDF
            </UButton>
            <UButton icon="i-tabler-pencil" variant="ghost" @click="openEdit(item)">
              Editar
            </UButton>
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              @click="confirmDelete(item)"
            >
              Eliminar
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
                {{ item.active ? 'Activo' : 'Inactivo' }}
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
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon="i-tabler-external-link"
            >
              Ver PDF
            </UButton>
            <UButton icon="i-tabler-pencil" variant="ghost" @click="openEdit(item)">
              Editar
            </UButton>
            <UButton
              icon="i-tabler-trash"
              variant="ghost"
              color="error"
              @click="confirmDelete(item)"
            >
              Eliminar
            </UButton>
          </div>
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-3xl' }">
      <template #content>
        <div class="flex max-h-[85vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar documento' : 'Nuevo documento' }}
            </h2>

            <form id="equality-form" class="space-y-4" @submit.prevent="handleSubmit">
              <div>
                <UFormField label="Estado">
                  <div class="flex items-center gap-2">
                    <USwitch v-model="form.active" />
                    <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                </UFormField>
              </div>

              <UFormField label="PDF">
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
                      <p class="font-medium">Archivo actual</p>
                      <p class="text-muted mt-1 text-sm break-all">
                        {{ pdfName || 'Todavía no has subido ningún PDF.' }}
                      </p>
                    </div>

                    <UButton
                      type="button"
                      variant="outline"
                      icon="i-tabler-upload"
                      :loading="isUploadingPdf"
                      @click="triggerPdfInput"
                    >
                      {{ form.pdfUrl ? 'Cambiar PDF' : 'Subir PDF' }}
                    </UButton>
                  </div>
                </div>
              </UFormField>

              <div
                v-for="translation in form.translations"
                :key="translation.locale"
                class="rounded-lg border p-4"
              >
                <h3 class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(translation.locale)" class="size-5" />
                  {{ getLocaleName(translation.locale) }}
                  <span v-if="!isDefaultLocale(translation.locale)" class="text-muted text-xs">
                    (opcional)
                  </span>
                </h3>

                <div class="space-y-3">
                  <UFormField :label="isDefaultLocale(translation.locale) ? 'Título *' : 'Título'">
                    <UInput v-model="translation.title" class="w-full" />
                  </UFormField>

                  <UFormField
                    :label="isDefaultLocale(translation.locale) ? 'Descripción *' : 'Descripción'"
                  >
                    <UTextarea v-model="translation.description" :rows="4" class="w-full" />
                  </UFormField>

                  <UFormField label="Meta">
                    <UInput v-model="translation.meta" class="w-full" />
                  </UFormField>
                </div>
              </div>
            </form>
          </div>

          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" form="equality-form" :loading="isSubmitting">
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
            ¿Estás seguro de que deseas eliminar "{{ getDocumentTitle(itemToDelete) }}"? Esta acción
            no se puede deshacer.
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
