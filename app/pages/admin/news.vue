<script setup lang="ts">
/**
 * Admin News Management with drag-and-drop reordering
 */
import Sortable from 'sortablejs'
import { CalendarDate } from '@internationalized/date'

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
  alt: string
}

interface TagTranslation {
  locale: string
  name: string
}

interface Tag {
  id: string
  slug: string
  translations: TagTranslation[]
}

interface NewsItem {
  id: string
  image: string
  to: string
  order: number
  active: boolean
  publishedAt: string
  translations: Translation[]
  tags: Array<{
    id: string
    newsItemId: string
    tagId: string
    tag: Tag
  }>
}

const { data, refresh } = await useFetch<{ items: NewsItem[] }>('/api/admin/news')
const { data: tagsData } = await useFetch<{ items: Tag[] }>('/api/admin/tags')

const toast = useToast()

const items = computed(() => data.value?.items ?? [])
const tags = computed(() => tagsData.value?.items ?? [])

// Local items for drag-and-drop
const localItems = ref<NewsItem[]>([])
const isSavingOrder = ref(false)

// Computed to check if order has changed by comparing IDs
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

// Locales composable
const { localeConfigs, getLocaleFlag, getLocaleName } = useLocales()

// Modal state
const showModal = ref(false)
const editingItem = ref<NewsItem | null>(null)
const isSubmitting = ref(false)

// Delete confirmation modal
const showDeleteModal = ref(false)
const itemToDelete = ref<NewsItem | null>(null)
const isDeleting = ref(false)

// Form state with CalendarDate for date picker
const today = new Date()
const publishedAt = shallowRef(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
)
const inputDate = useTemplateRef('inputDate')
const form = reactive({
  image: '',
  to: '',
  order: 0,
  active: true,
  tagIds: [] as string[],
  translations: localeConfigs.value.map((l) => ({
    locale: l.code,
    title: '',
    alt: '',
  })),
})

// Tag select items
const tagSelectItems = computed(() =>
  tags.value.map((t) => ({
    value: t.id,
    label: getTagName(t),
  }))
)

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

    await $fetch('/api/admin/news/reorder', {
      method: 'POST',
      body: { items: updates },
    })

    await refresh()
    toast.add({
      title: 'Orden de noticias guardado',
      color: 'success',
    })
  } catch (e) {
    console.error('Error saving order:', e)
    toast.add({
      title: 'No se pudo guardar el orden de noticias',
      color: 'error',
    })
  } finally {
    isSavingOrder.value = false
  }
}

const cancelOrderChanges = () => {
  localItems.value = [...items.value]
}

// Helper to convert CalendarDate to ISO string
const calendarDateToISO = (date: CalendarDate): string => {
  return new Date(date.year, date.month - 1, date.day).toISOString()
}

// Helper to convert ISO string to CalendarDate
const isoToCalendarDate = (iso: string): CalendarDate => {
  const d = new Date(iso)
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

const openCreate = () => {
  editingItem.value = null
  form.image = ''
  form.to = ''
  form.order = items.value.length
  form.active = true
  form.tagIds = []
  const now = new Date()
  publishedAt.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  form.translations = localeConfigs.value.map((l) => ({
    locale: l.code,
    title: '',
    alt: '',
  }))
  showModal.value = true
}

const openEdit = (item: NewsItem) => {
  editingItem.value = item
  form.image = item.image
  form.to = item.to
  form.order = item.order
  form.active = item.active
  form.tagIds = item.tags.map((nt) => nt.tagId)
  publishedAt.value = isoToCalendarDate(item.publishedAt)
  // Map existing translations to form, ensuring all locales are present
  form.translations = localeConfigs.value.map((l) => {
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
    const body = {
      ...form,
      publishedAt: calendarDateToISO(publishedAt.value),
    }
    if (editingItem.value) {
      await $fetch(`/api/admin/news/${editingItem.value.id}`, {
        method: 'PUT',
        body,
      })
      toast.add({
        title: 'Noticia actualizada',
        color: 'success',
      })
    } else {
      await $fetch('/api/admin/news', {
        method: 'POST',
        body,
      })
      toast.add({
        title: 'Noticia creada',
        color: 'success',
      })
    }
    showModal.value = false
    await refresh()
  } catch (e) {
    console.error('Error saving:', e)
    toast.add({
      title: 'No se pudo guardar la noticia',
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: NewsItem) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/news/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({
      title: 'Noticia eliminada',
      color: 'success',
    })
  } catch (e) {
    console.error('Error deleting:', e)
    toast.add({
      title: 'No se pudo eliminar la noticia',
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const getTagName = (tag: Tag) => {
  // Use Spanish translation as default, fallback to slug
  const esTranslation = tag.translations.find((t) => t.locale === 'es')
  return esTranslation?.name ?? tag.slug
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Noticias</h1>
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
            width="160"
            height="90"
            class="h-20 w-36 rounded-lg object-cover"
          />
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ item.translations[0]?.title }}</h3>
            <p class="text-muted truncate text-sm">{{ item.to }}</p>
            <div class="mt-1 flex flex-wrap items-center gap-2">
              <span
                :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
                class="rounded-full px-2 py-0.5 text-xs"
              >
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </span>
              <span
                v-for="newsTag in item.tags"
                :key="newsTag.id"
                class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
              >
                {{ getTagName(newsTag.tag) }}
              </span>
              <span v-if="!item.tags.length" class="text-muted text-xs italic">Sin etiquetas</span>
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
            width="160"
            height="90"
            class="w-full rounded-lg object-cover"
          />
          <p class="text-muted text-sm break-all">{{ item.to }}</p>
          <div class="flex flex-wrap items-center gap-2">
            <span
              v-for="newsTag in item.tags"
              :key="newsTag.id"
              class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
            >
              {{ getTagName(newsTag.tag) }}
            </span>
            <span v-if="!item.tags.length" class="text-muted text-xs italic">Sin etiquetas</span>
          </div>
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

      <div v-if="!localItems.length" class="text-muted py-12 text-center">No hay noticias</div>
    </div>

    <!-- Edit/Create Modal -->
    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar noticia' : 'Nueva noticia' }}
            </h2>

            <form id="news-form" class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Imagen (URL)">
                <UInput v-model="form.image" placeholder="/test/imagen.jpg" class="w-full" />
              </UFormField>

              <UFormField label="Enlace">
                <UInput v-model="form.to" placeholder="/noticias/slug" class="w-full" />
              </UFormField>

              <UFormField label="Etiquetas">
                <USelectMenu
                  v-model="form.tagIds"
                  :items="tagSelectItems"
                  value-key="value"
                  multiple
                  class="w-full"
                  placeholder="Selecciona etiquetas..."
                />
              </UFormField>

              <div class="grid grid-cols-2 gap-4">
                <UFormField label="Fecha publicación">
                  <UInputDate ref="inputDate" v-model="publishedAt" class="w-full">
                    <template #trailing>
                      <UPopover
                        :reference="inputDate?.inputsRef[3]?.$el"
                        :popper="{ strategy: 'fixed' }"
                      >
                        <UButton
                          color="neutral"
                          variant="link"
                          size="sm"
                          icon="i-tabler-calendar"
                          aria-label="Seleccionar fecha"
                          class="px-0"
                        />

                        <template #content>
                          <UCalendar v-model="publishedAt" class="p-2" />
                        </template>
                      </UPopover>
                    </template>
                  </UInputDate>
                </UFormField>
                <UFormField label="Estado">
                  <div class="flex items-center gap-2">
                    <USwitch v-model="form.active" />
                    <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
                  </div>
                </UFormField>
              </div>

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
                    <UInput
                      v-model="trans.title"
                      class="w-full"
                      :required="trans.locale === 'es'"
                    />
                  </UFormField>
                  <UFormField label="Texto alternativo (descripción de la imagen)">
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
            <UButton type="submit" form="news-form" :loading="isSubmitting">
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
