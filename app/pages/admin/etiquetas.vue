<script setup lang="ts">
import { getApiErrorMessage, getApiErrorStatusCode } from '~~/shared/utils/apiError'
import { createTagClientSchema } from '~~/shared/utils/adminClientSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Etiquetas',
})

const toast = useToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()
const {
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  filterNonEmptyTranslations,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

interface Translation {
  locale: string
  name: string
}

interface Tag {
  id: string
  slug: string
  order: number
  updatedAt: string
  translations: Translation[]
}

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: Tag[]
}>('/api/admin/tags', {
  lazy: true,
})

const sortTags = (left: Tag, right: Tag) => {
  if (left.order !== right.order) {
    return left.order - right.order
  }

  return left.id.localeCompare(right.id, 'es')
}

const { items, removeItem, replaceItem, setItems } = useAdminMutableCollection(data, {
  sortItems: sortTags,
})
const isSubmitting = ref(false)
const isDeleting = ref(false)

const form = reactive({
  slug: '',
  order: 0,
  translations: createEmptyTranslations<Translation>({
    name: '',
  }),
})

const buildPayload = () => ({
  slug: form.slug,
  order: form.order,
  translations: filterNonEmptyTranslations(form.translations, 'name'),
})

const buildPayloadSnapshot = () =>
  JSON.stringify({
    ...buildPayload(),
    translations: buildPayload().translations.map((translation) => ({
      locale: translation.locale,
      name: translation.name,
    })),
  })

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
} = useAdminCollectionState<Tag>({
  items,
  persistOrder: async (updates) => {
    await $fetch('/api/admin/tags/reorder', {
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
    form.slug = ''
    form.order = items.value.length
    form.translations = createEmptyTranslations<Translation>({
      name: '',
    })
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.slug = item.slug
    form.order = item.order
    form.translations = mapTranslationsToForm(item.translations, {
      name: '',
    }) as Translation[]
    resetFormSnapshot()
  },
})

const saveOrder = async () => {
  try {
    await persistOrder()
    await refreshAllClientAsyncData()
    toast.add({
      title: 'Orden guardado correctamente',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo guardar el orden'),
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

  if (!validate(createTagClientSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: Tag }>(`/api/admin/tags/${editingItem.value.id}`, {
        method: 'PUT',
        body: {
          ...payload,
          updatedAt: editingItem.value.updatedAt,
        },
      })
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({
        title: 'Etiqueta actualizada',
        color: 'success',
      })
    } else {
      const response = await $fetch<{ data: Tag }>('/api/admin/tags', {
        method: 'POST',
        body: payload,
      })
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({
        title: 'Etiqueta creada',
        color: 'success',
      })
    }
    closeModal()
    clearErrors()
  } catch (e: unknown) {
    const err = e as { data?: { message?: string } }
    if (getApiErrorStatusCode(e) === 409 && err.data?.message === 'SLUG_EXISTS') {
      toast.add({
        title: 'Ya existe una etiqueta con ese slug',
        color: 'error',
      })
    } else {
      toast.add({
        title: getApiErrorMessage(e, 'No se pudo guardar la etiqueta'),
        color: 'error',
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/tags/${itemToDelete.value.id}`, { method: 'DELETE' })
    removeItem(itemToDelete.value.id)
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({
      title: 'Etiqueta eliminada',
      color: 'success',
    })
  } catch (e) {
    toast.add({
      title: getApiErrorMessage(e, 'No se pudo eliminar la etiqueta'),
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
      <h1 class="text-2xl font-bold">Etiquetas</h1>
      <div class="flex gap-2">
        <template v-if="hasOrderChanges">
          <UButton variant="outline" @click="cancelOrderChanges">Cancelar</UButton>
          <UButton :loading="isSavingOrder" @click="saveOrder">Guardar orden</UButton>
        </template>
        <UButton v-else icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
      </div>
    </div>

    <div v-if="pending" class="space-y-3" aria-hidden="true">
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-20 w-full rounded-xl" />
      <USkeleton class="h-20 w-full rounded-xl" />
    </div>

    <div v-else-if="fetchError" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        title="No se pudieron cargar las etiquetas"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <div v-else ref="listRef" class="space-y-2">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface ring-default flex items-center gap-4 rounded-xl p-4 shadow-sm ring-1"
      >
        <div class="drag-handle cursor-grab active:cursor-grabbing">
          <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
        </div>
        <div class="min-w-0 flex-1">
          <h3 class="wrap-break-words font-medium">{{ item.translations[0]?.name }}</h3>
          <p class="text-muted text-sm break-all">Slug: {{ item.slug }}</p>
        </div>
        <div class="flex shrink-0 gap-2">
          <UButton
            icon="i-tabler-pencil"
            variant="ghost"
            size="sm"
            aria-label="Editar etiqueta"
            @click="openEdit(item)"
          />
          <UButton
            icon="i-tabler-trash"
            variant="ghost"
            color="error"
            size="sm"
            aria-label="Eliminar etiqueta"
            @click="confirmDelete(item)"
          />
        </div>
      </div>

      <div v-if="!localItems.length" class="py-12 text-center">
        <p class="text-muted">No hay etiquetas todavía.</p>
        <UButton class="mt-4" size="sm" icon="i-tabler-plus" @click="openCreate">
          Añadir etiqueta
        </UButton>
      </div>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar etiqueta' : 'Nueva etiqueta' }}
            </h2>

            <form id="tags-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Slug (identificador único)" :error="getFieldError('slug')">
                <UInput v-model="form.slug" placeholder="mi-etiqueta" class="w-full" />
              </UFormField>

              <div
                v-for="(trans, index) in form.translations"
                :key="trans.locale"
                class="rounded-lg border p-4"
              >
                <h4 class="mb-2 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
                  {{ getLocaleName(trans.locale) }}
                </h4>
                <UFormField
                  :label="`Nombre ${!isDefaultLocale(trans.locale) ? '(opcional)' : ''}`"
                  :error="getFieldError(`translations.${index}.name`)"
                >
                  <UInput v-model="trans.name" class="w-full" />
                </UFormField>
              </div>
            </form>
          </div>
          <div class="flex justify-end gap-2 border-t p-4">
            <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
            <UButton
              type="submit"
              form="tags-form"
              :loading="isSubmitting"
              :disabled="Boolean(editingItem) && !hasFormChanges"
            >
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
            ¿Estás seguro de que deseas eliminar la etiqueta "{{
              itemToDelete?.translations[0]?.name
            }}"? Esta acción no se puede deshacer.
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
