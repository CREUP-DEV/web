<script setup lang="ts">
/**
 * Admin Tags Management with drag-and-drop reordering
 */
import Sortable from 'sortablejs'
import type { LocaleConfig } from '~/composables/useLocales'

definePageMeta({
  layout: 'admin',
})

// Check auth
const { error: authError } = await useFetch('/api/admin/session')
if (authError.value) {
  navigateTo('/admin/login')
}

const { t } = useI18n()
const toast = useToast()
const { localeConfigs, getLocaleFlag, getLocaleName, filterNonEmptyTranslations } = useLocales()

interface Translation {
  locale: string
  name: string
}

interface Tag {
  id: string
  slug: string
  order: number
  translations: Translation[]
}

const { data, refresh } = await useFetch<{ items: Tag[] }>('/api/admin/tags')

const items = computed(() => data.value?.items ?? [])

// Local items for drag-and-drop
const localItems = ref<Tag[]>([])
const isSavingOrder = ref(false)

// Computed: detect if order changed from original
const hasOrderChanges = computed(() => {
  if (localItems.value.length !== items.value.length) return false
  return localItems.value.some((item, index) => item.id !== items.value[index]?.id)
})

// Sync local items with server data
watch(
  items,
  (newItems) => {
    localItems.value = [...newItems]
  },
  { immediate: true }
)

// Modal state
const showModal = ref(false)
const editingItem = ref<Tag | null>(null)
const isSubmitting = ref(false)

// Delete confirmation modal
const showDeleteModal = ref(false)
const itemToDelete = ref<Tag | null>(null)
const isDeleting = ref(false)

// Form state
const form = reactive({
  slug: '',
  order: 0,
  translations: [
    { locale: 'es', name: '' },
    { locale: 'en', name: '' },
  ],
})

// Sortable setup
const listRef = ref<HTMLElement | null>(null)
let sortableInstance: Sortable | null = null

onMounted(() => {
  if (listRef.value) {
    sortableInstance = Sortable.create(listRef.value, {
      animation: 150,
      handle: '.drag-handle',
      ghostClass: 'opacity-50',
      onEnd: (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined) {
          const movedItem = localItems.value.splice(evt.oldIndex, 1)[0]
          if (movedItem) {
            localItems.value.splice(evt.newIndex, 0, movedItem)
          }
        }
      },
    })
  }
})

onUnmounted(() => {
  sortableInstance?.destroy()
})

const saveOrder = async () => {
  isSavingOrder.value = true
  try {
    const updates = localItems.value.map((item, index) => ({
      id: item.id,
      order: index,
    }))

    await $fetch('/api/admin/tags/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
    toast.add({
      title: t('admin.messages.tagOrderSaved'),
      color: 'success',
    })
  } catch (e) {
    console.error('Error saving order:', e)
    toast.add({
      title: t('admin.errors.tagOrderSaveFailed'),
      color: 'error',
    })
  } finally {
    isSavingOrder.value = false
  }
}

const cancelOrderChanges = () => {
  localItems.value = [...items.value]
}

const openCreate = () => {
  editingItem.value = null
  form.slug = ''
  form.order = items.value.length
  form.translations = localeConfigs.value.map((l: LocaleConfig) => ({
    locale: l.code,
    name: '',
  }))
  showModal.value = true
}

const openEdit = (item: Tag) => {
  editingItem.value = item
  form.slug = item.slug
  form.order = item.order
  form.translations = localeConfigs.value.map((l: LocaleConfig) => {
    const existing = item.translations.find((t) => t.locale === l.code)
    return {
      locale: l.code,
      name: existing?.name ?? '',
    }
  })
  showModal.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      slug: form.slug,
      order: form.order,
      translations: filterNonEmptyTranslations(form.translations, 'name'),
    }

    if (editingItem.value) {
      await $fetch(`/api/admin/tags/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({
        title: t('admin.messages.tagUpdated'),
        color: 'success',
      })
    } else {
      await $fetch('/api/admin/tags', {
        method: 'POST',
        body: payload,
      })
      toast.add({
        title: t('admin.messages.tagCreated'),
        color: 'success',
      })
    }
    showModal.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { status?: number; data?: { message?: string } }
    if (err.status === 409 && err.data?.message === 'SLUG_EXISTS') {
      toast.add({
        title: t('admin.errors.slugExists'),
        color: 'error',
      })
    } else {
      console.error('Error saving:', e)
      toast.add({
        title: t('admin.errors.tagSaveFailed'),
        color: 'error',
      })
    }
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: Tag) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/tags/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({
      title: t('admin.messages.tagDeleted'),
      color: 'success',
    })
  } catch (e) {
    console.error('Error deleting:', e)
    toast.add({
      title: t('admin.errors.tagDeleteFailed'),
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

    <div ref="listRef" class="space-y-2">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface flex items-center gap-4 rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
      >
        <div class="drag-handle cursor-grab active:cursor-grabbing">
          <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
        </div>
        <div class="flex-1">
          <h3 class="font-medium">{{ item.translations[0]?.name }}</h3>
          <p class="text-muted text-sm">Slug: {{ item.slug }}</p>
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

      <div v-if="!localItems.length" class="text-muted py-12 text-center">No hay etiquetas</div>
    </div>

    <!-- Edit/Create Modal -->
    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="max-h-[80vh] overflow-y-auto p-6">
          <h2 class="mb-4 text-lg font-bold">
            {{ editingItem ? 'Editar etiqueta' : 'Nueva etiqueta' }}
          </h2>

          <form class="space-y-4" @submit.prevent="handleSubmit">
            <UFormField label="Slug (identificador único)">
              <UInput v-model="form.slug" placeholder="mi-etiqueta" class="w-full" />
            </UFormField>

            <div
              v-for="trans in form.translations"
              :key="trans.locale"
              class="rounded-lg border p-4"
            >
              <h4 class="mb-2 flex items-center gap-2 font-medium">
                <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
                {{ getLocaleName(trans.locale) }}
              </h4>
              <UFormField :label="`Nombre ${trans.locale !== 'es' ? '(opcional)' : ''}`">
                <UInput v-model="trans.name" class="w-full" />
              </UFormField>
            </div>

            <div class="flex justify-end gap-2 pt-4">
              <UButton type="button" variant="ghost" @click="showModal = false">Cancelar</UButton>
              <UButton type="submit" :loading="isSubmitting">
                {{ editingItem ? 'Guardar' : 'Crear' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <!-- Delete Confirmation Modal -->
    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 rounded-full p-2">
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
