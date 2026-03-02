<script setup lang="ts">
/**
 * Admin Carousel Management with drag-and-drop reordering
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
  translations: Translation[]
}

const toast = useToast()

const defaultCarouselImage = '/img/carousel/default.jpg'

const { data, refresh } = await useFetch<{ items: CarouselItem[] }>('/api/admin/carousel')

const items = computed(() => data.value?.items ?? [])

// Local items for drag-and-drop
const localItems = ref<CarouselItem[]>([])
const isSavingOrder = ref(false)

// Computed to check if order has changed by comparing IDs
const hasOrderChanges = computed(() => {
  if (localItems.value.length !== items.value.length) return false
  return localItems.value.some(
    (item: CarouselItem, index: number) => item.id !== items.value[index]?.id
  )
})

// Sync local items with server data
watch(
  items,
  (newItems: CarouselItem[]) => {
    localItems.value = [...newItems]
  },
  { immediate: true }
)

// Locales composable
const { localeConfigs, getLocaleFlag, getLocaleName } = useLocales()

// Modal state
const showModal = ref(false)
const editingItem = ref<CarouselItem | null>(null)
const isSubmitting = ref(false)

// Delete confirmation modal
const showDeleteModal = ref(false)
const itemToDelete = ref<CarouselItem | null>(null)
const isDeleting = ref(false)

// Form state - dynamic based on available locales
const emptyTranslation = { title: '', buttonText: '', alt: '' }
const form = reactive({
  image: '',
  href: '',
  order: 0,
  active: true,
  translations: localeConfigs.value.map((localeConfig: LocaleConfig) => ({
    locale: localeConfig.code,
    ...emptyTranslation,
  })),
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
    const updates = localItems.value.map((item: CarouselItem, index: number) => ({
      id: item.id,
      order: index,
    }))

    await $fetch('/api/admin/carousel/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
    toast.add({
      title: 'Orden del carrusel guardado',
      color: 'success',
    })
  } catch (e) {
    console.error('Error saving order:', e)
    toast.add({
      title: 'No se pudo guardar el orden del carrusel',
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
  form.href = ''
  form.order = items.value.length
  form.active = true
  // Create empty translations for all available locales
  form.translations = localeConfigs.value.map((localeConfig: LocaleConfig) => ({
    locale: localeConfig.code,
    title: '',
    buttonText: '',
    alt: '',
  }))
  showModal.value = true
}

const openEdit = (item: CarouselItem) => {
  editingItem.value = item
  form.image = item.image
  form.href = item.href
  form.order = item.order
  form.active = item.active
  // Map existing translations to form, ensuring all locales are present
  form.translations = localeConfigs.value.map((localeConfig: LocaleConfig) => {
    const existing = item.translations.find(
      (translation) => translation.locale === localeConfig.code
    )
    return {
      locale: localeConfig.code,
      title: existing?.title ?? '',
      buttonText: existing?.buttonText ?? '',
      alt: existing?.alt ?? '',
    }
  })
  showModal.value = true
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const payload = {
      ...form,
      image: form.image.trim() || defaultCarouselImage,
      href: form.href.trim(),
    }
    if (editingItem.value) {
      await $fetch(`/api/admin/carousel/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
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
    showModal.value = false
    await refresh()
  } catch (e) {
    console.error('Error saving:', e)
    toast.add({
      title: 'No se pudo guardar el elemento del carrusel',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: CarouselItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/carousel/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({
      title: 'Elemento del carrusel eliminado',
      color: 'success',
    })
  } catch (e) {
    console.error('Error deleting:', e)
    toast.add({
      title: 'No se pudo eliminar el elemento del carrusel',
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
          <div class="bg-muted aspect-1925/550 w-40 max-w-40 overflow-hidden rounded-lg">
            <NuxtImg
              :src="item.image || defaultCarouselImage"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              width="385"
              height="110"
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
          <div class="bg-muted aspect-1925/550 w-full overflow-hidden rounded-lg">
            <NuxtImg
              :src="item.image || defaultCarouselImage"
              alt=""
              aria-hidden="true"
              class="size-full object-contain"
              width="385"
              height="110"
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
        No hay elementos en el carrusel
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar elemento' : 'Nuevo elemento' }}
            </h2>

            <form id="carousel-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Imagen (URL, opcional)">
                <UInput
                  v-model="form.image"
                  placeholder="/img/carousel/ejemplo.jpg"
                  class="w-full"
                />
                <p class="text-muted mt-1 text-xs">
                  Si no se indica imagen, se usará la predeterminada. Tamaño recomendado: 1925 × 550
                  px.
                </p>
              </UFormField>

              <UFormField label="Enlace">
                <UInput v-model="form.href" placeholder="/pagina" class="w-full" />
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
                  <span v-if="trans.locale !== 'es'" class="text-muted text-xs"> (opcional) </span>
                </h4>
                <div class="space-y-3">
                  <UFormField :label="trans.locale === 'es' ? 'Título *' : 'Título'">
                    <UTextarea
                      v-model="trans.title"
                      :rows="2"
                      class="w-full"
                      :required="trans.locale === 'es'"
                    />
                  </UFormField>
                  <UFormField
                    :label="trans.locale === 'es' ? 'Texto del botón *' : 'Texto del botón'"
                  >
                    <UInput
                      v-model="trans.buttonText"
                      class="w-full"
                      :required="trans.locale === 'es'"
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
