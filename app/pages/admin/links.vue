<script setup lang="ts">
/**
 * Admin Featured Links Management with drag-and-drop reordering
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

const { localeConfigs, getLocaleFlag, getLocaleName, filterNonEmptyTranslations } = useLocales()
const toast = useToast()

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

const { data, refresh } = await useFetch<{ items: FeaturedLink[] }>('/api/admin/links')

const items = computed(() => data.value?.items ?? [])

// Local items for drag-and-drop
const localItems = ref<FeaturedLink[]>([])
const isSavingOrder = ref(false)

// Computed: detect if order changed from original
const hasOrderChanges = computed(() => {
  if (localItems.value.length !== items.value.length) return false
  return localItems.value.some(
    (item: FeaturedLink, index: number) => item.id !== items.value[index]?.id
  )
})

// Sync local items with server data
watch(
  items,
  (newItems: FeaturedLink[]) => {
    localItems.value = [...newItems]
  },
  { immediate: true }
)

// Modal state
const showModal = ref(false)
const editingItem = ref<FeaturedLink | null>(null)
const isSubmitting = ref(false)

// Delete confirmation modal
const showDeleteModal = ref(false)
const itemToDelete = ref<FeaturedLink | null>(null)
const isDeleting = ref(false)

// Form state
const form = reactive({
  image: '',
  to: '',
  order: 0,
  active: true,
  translations: [
    { locale: 'es', title: '', alt: '' },
    { locale: 'en', title: '', alt: '' },
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
    const updates = localItems.value.map((item: FeaturedLink, index: number) => ({
      id: item.id,
      order: index,
    }))

    await $fetch('/api/admin/links/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
    toast.add({
      title: 'Orden de enlaces guardado',
      color: 'success',
    })
  } catch (e) {
    console.error('Error saving order:', e)
    toast.add({
      title: 'No se pudo guardar el orden de enlaces',
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
  form.image = ''
  form.to = ''
  form.order = items.value.length
  form.active = true
  form.translations = localeConfigs.value.map((l: LocaleConfig) => ({
    locale: l.code,
    title: '',
    alt: '',
  }))
  showModal.value = true
}

const openEdit = (item: FeaturedLink) => {
  editingItem.value = item
  form.image = item.image
  form.to = item.to
  form.order = item.order
  form.active = item.active
  form.translations = localeConfigs.value.map((l: LocaleConfig) => {
    const existing = item.translations.find((t) => t.locale === l.code)
    return {
      locale: l.code,
      title: existing?.title ?? '',
      alt: existing?.alt ?? '',
    }
  })
  showModal.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      image: form.image,
      to: form.to,
      order: form.order,
      active: form.active,
      translations: filterNonEmptyTranslations(form.translations, 'title'),
    }

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
    showModal.value = false
    await refresh()
  } catch (e) {
    console.error('Error saving:', e)
    toast.add({
      title: 'No se pudo guardar el enlace',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: FeaturedLink) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/links/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({
      title: 'Enlace eliminado',
      color: 'success',
    })
  } catch (e) {
    console.error('Error deleting:', e)
    toast.add({
      title: 'No se pudo eliminar el enlace',
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

    <div ref="listRef" class="space-y-4">
      <div
        v-for="item in localItems"
        :key="item.id"
        class="bg-surface rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
      >
        <!-- Desktop layout -->
        <div class="hidden items-center gap-4 md:flex">
          <div class="drag-handle cursor-grab active:cursor-grabbing">
            <UIcon name="i-tabler-grip-vertical" class="text-muted size-5" />
          </div>
          <NuxtImg
            :src="item.image"
            alt=""
            aria-hidden="true"
            width="128"
            height="128"
            class="h-16 w-16 rounded-lg object-cover"
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

        <!-- Mobile layout -->
        <div class="space-y-3 md:hidden">
          <div class="flex justify-center">
            <div class="drag-handle cursor-grab active:cursor-grabbing">
              <UIcon name="i-tabler-grip-horizontal" class="text-muted size-5" />
            </div>
          </div>
          <h3 class="wrap-break-words font-medium">{{ item.translations[0]?.title }}</h3>
          <NuxtImg
            :src="item.image"
            alt=""
            aria-hidden="true"
            width="128"
            height="128"
            class="mx-auto h-32 w-32 rounded-lg object-cover"
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

      <div v-if="!localItems.length" class="text-muted py-12 text-center">
        No hay enlaces destacados
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar enlace' : 'Nuevo enlace' }}
            </h2>

            <form id="links-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Imagen (URL)">
                <UInput v-model="form.image" placeholder="/test/imagen.jpg" class="w-full" />
              </UFormField>

              <UFormField label="Enlace (URL)">
                <UInput v-model="form.to" placeholder="https://..." class="w-full" />
              </UFormField>

              <UFormField label="Estado">
                <div class="flex items-center gap-2">
                  <USwitch v-model="form.active" />
                  <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
                </div>
              </UFormField>

              <div
                v-for="trans in form.translations"
                :key="trans.locale"
                class="rounded-lg border p-4"
              >
                <h4 class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
                  {{ getLocaleName(trans.locale) }}
                </h4>
                <div class="space-y-3">
                  <UFormField :label="`Título ${trans.locale !== 'es' ? '(opcional)' : ''}`">
                    <UInput v-model="trans.title" class="w-full" />
                  </UFormField>
                  <UFormField
                    :label="`Texto alternativo ${trans.locale !== 'es' ? '(opcional)' : ''}`"
                  >
                    <UInput
                      v-model="trans.alt"
                      :placeholder="trans.title || 'Descripción de la imagen'"
                      class="w-full"
                    />
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
