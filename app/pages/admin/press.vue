<script setup lang="ts">
/**
 * Admin Press Articles Management
 * Unified CRUD for press releases, statements, and media appearances
 * with tab-based filtering and type-specific form fields
 */
import { CalendarDate } from '@internationalized/date'

definePageMeta({
  layout: 'admin',
})

// Check auth
const { error: authError } = await useFetch('/api/admin/session')
if (authError.value) {
  navigateTo('/admin/login')
}

// Types
type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

interface Translation {
  locale: string
  title: string
  description: string
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

interface MediaOutlet {
  id: string
  name: string
  website: string
  logo: string
}

interface PressArticle {
  id: string
  type: PressArticleType
  slug: string
  image: string
  pdfUrl: string | null
  externalUrl: string | null
  mediaOutletId: string | null
  active: boolean
  publishedAt: string
  translations: Translation[]
  tags: Array<{
    id: string
    pressArticleId: string
    tagId: string
    tag: Tag
  }>
  mediaOutlet: MediaOutlet | null
}

const toast = useToast()
const { localeConfigs, getLocaleFlag, getLocaleName } = useLocales()

// Current type tab
const currentType = ref<PressArticleType | null>(null)

const typeLabels: Record<PressArticleType, string> = {
  press_release: 'Notas de prensa',
  statement: 'Comunicados',
  media_appearance: 'En los medios',
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-file-text',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

// Fetch all data
const { data, refresh } = await useFetch<{ items: PressArticle[] }>('/api/admin/press')
const { data: tagsData } = await useFetch<{ items: Tag[] }>('/api/admin/tags')
const { data: mediaData } = await useFetch<{ items: MediaOutlet[] }>('/api/admin/media')

const allItems = computed(() => data.value?.items ?? [])
const tags = computed(() => tagsData.value?.items ?? [])
const mediaOutlets = computed(() => mediaData.value?.items ?? [])

// Filter items by current type (null = show all)
const items = computed(() =>
  currentType.value
    ? allItems.value.filter((item: PressArticle) => item.type === currentType.value)
    : allItems.value
)

// Modal state
const showModal = ref(false)
const editingItem = ref<PressArticle | null>(null)
const isSubmitting = ref(false)

// Delete confirmation
const showDeleteModal = ref(false)
const itemToDelete = ref<PressArticle | null>(null)
const isDeleting = ref(false)

// File upload state
const imageInputRef = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const isUploadingImage = ref(false)
const pdfInputRef = ref<HTMLInputElement | null>(null)
const pdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)

// Date picker
const today = new Date()
const publishedAt = shallowRef(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
)
const inputDate = useTemplateRef('inputDate')

// Form state
const form = reactive({
  type: 'press_release' as PressArticleType,
  image: '',
  pdfUrl: '' as string | null,
  externalUrl: '' as string | null,
  mediaOutletId: '' as string | null,
  active: true,
  tagIds: [] as string[],
  translations: localeConfigs.value.map((l: { code: string }) => ({
    locale: l.code,
    title: '',
    description: '',
    alt: '',
  })),
})

// Tag select items (exclude the 'all' meta-tag)
const tagSelectItems = computed(() =>
  tags.value
    .filter((t: Tag) => t.slug !== 'all')
    .map((t: Tag) => ({
      value: t.id,
      label: getTagName(t),
    }))
)

// Media outlet select items
const mediaOutletSelectItems = computed(() =>
  mediaOutlets.value.map((m: MediaOutlet) => ({
    value: m.id,
    label: m.name,
  }))
)

// Helpers
const calendarDateToISO = (date: CalendarDate): string => {
  return new Date(date.year, date.month - 1, date.day).toISOString()
}

const isoToCalendarDate = (iso: string): CalendarDate => {
  const d = new Date(iso)
  return new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

const getTagName = (tag: Tag) => {
  const esTranslation = tag.translations.find((t: TagTranslation) => t.locale === 'es')
  return esTranslation?.name ?? tag.slug
}

const getItemTitle = (item: PressArticle) => {
  const esTranslation = item.translations.find((t: Translation) => t.locale === 'es')
  return esTranslation?.title ?? item.translations[0]?.title ?? ''
}

const formatDate = (iso: string) => {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

const typeUrlPrefix: Record<PressArticleType, string> = {
  press_release: '/prensa/notas-prensa',
  statement: '/prensa/comunicados',
  media_appearance: '/prensa/en-los-medios',
}

// Form actions
const openCreate = () => {
  editingItem.value = null
  form.type = currentType.value ?? 'press_release'
  form.image = ''
  form.pdfUrl = null
  form.externalUrl = null
  form.mediaOutletId = null
  form.active = true
  form.tagIds = []
  imagePreview.value = null
  pdfName.value = null
  const now = new Date()
  publishedAt.value = new CalendarDate(now.getFullYear(), now.getMonth() + 1, now.getDate())
  form.translations = localeConfigs.value.map((l: { code: string }) => ({
    locale: l.code,
    title: '',
    description: '',
    alt: '',
  }))
  showModal.value = true
}

const openEdit = (item: PressArticle) => {
  editingItem.value = item
  form.type = item.type
  form.image = item.image
  form.pdfUrl = item.pdfUrl
  form.externalUrl = item.externalUrl
  form.mediaOutletId = item.mediaOutletId
  form.active = item.active
  form.tagIds = item.tags.map((t) => t.tagId)
  imagePreview.value = item.image || null
  pdfName.value = item.pdfUrl ? (item.pdfUrl.split('/').pop() ?? null) : null
  publishedAt.value = isoToCalendarDate(item.publishedAt)
  form.translations = localeConfigs.value.map((l: { code: string }) => {
    const existing = item.translations.find((t: Translation) => t.locale === l.code)
    return {
      locale: l.code,
      title: existing?.title ?? '',
      description: existing?.description ?? '',
      alt: existing?.alt ?? '',
    }
  })
  showModal.value = true
}

// File upload handlers
const triggerImageInput = () => {
  imageInputRef.value?.click()
}

const handleImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  isUploadingImage.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const result = await $fetch<{ path: string }>('/api/admin/press/upload', {
      method: 'POST',
      body: formData,
    })
    form.image = result.path
    toast.add({ title: 'Imagen subida correctamente', color: 'success' })
  } catch {
    imagePreview.value = null
    toast.add({ title: 'No se pudo subir la imagen', color: 'error' })
  } finally {
    isUploadingImage.value = false
    if (target) target.value = ''
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
    const result = await $fetch<{ path: string }>('/api/admin/press/upload', {
      method: 'POST',
      body: formData,
    })
    form.pdfUrl = result.path
    toast.add({ title: 'PDF subido correctamente', color: 'success' })
  } catch {
    pdfName.value = null
    toast.add({ title: 'No se pudo subir el PDF', color: 'error' })
  } finally {
    isUploadingPdf.value = false
    if (target) target.value = ''
  }
}

const handleSubmit = async () => {
  isSubmitting.value = true
  try {
    const body = {
      ...form,
      publishedAt: calendarDateToISO(publishedAt.value),
    }
    if (editingItem.value) {
      await $fetch(`/api/admin/press/${editingItem.value.id}`, {
        method: 'PUT',
        body,
      })
      toast.add({ title: 'Artículo actualizado', color: 'success' })
    } else {
      await $fetch('/api/admin/press', {
        method: 'POST',
        body,
      })
      toast.add({ title: 'Artículo creado', color: 'success' })
    }
    showModal.value = false
    await refresh()
  } catch (e) {
    console.error('Error saving:', e)
    toast.add({ title: 'No se pudo guardar el artículo', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: PressArticle) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/press/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Artículo eliminado', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo eliminar el artículo', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Artículos de prensa</h1>
      <UButton icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
    </div>

    <!-- Type tabs -->
    <div class="mb-6 flex gap-2 overflow-x-auto">
      <UButton
        :variant="currentType === null ? 'solid' : 'outline'"
        icon="i-tabler-list"
        size="sm"
        @click="currentType = null"
      >
        Todos
        <UBadge
          v-if="allItems.length"
          :label="String(allItems.length)"
          size="sm"
          :variant="currentType === null ? 'solid' : 'subtle'"
          :class="currentType === null ? 'bg-white/20 text-white' : ''"
          class="ml-1"
        />
      </UButton>
      <UButton
        v-for="(label, type) in typeLabels"
        :key="type"
        :icon="typeIcons[type as PressArticleType]"
        :variant="currentType === type ? 'solid' : 'outline'"
        size="sm"
        @click="currentType = type as PressArticleType"
      >
        {{ label }}
        <UBadge
          v-if="allItems.filter((i: PressArticle) => i.type === type).length"
          :label="String(allItems.filter((i: PressArticle) => i.type === type).length)"
          size="sm"
          :variant="currentType === type ? 'solid' : 'subtle'"
          :class="currentType === type ? 'bg-white/20 text-white' : ''"
          class="ml-1"
        />
      </UButton>
    </div>

    <!-- Articles list -->
    <div class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-surface rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
      >
        <!-- Desktop layout -->
        <div class="hidden items-center gap-4 md:flex">
          <NuxtImg
            :src="item.image"
            :alt="getItemTitle(item)"
            width="160"
            height="90"
            class="h-20 w-36 rounded-lg object-cover"
          />
          <div class="flex-1 overflow-hidden">
            <h3 class="truncate font-medium">{{ getItemTitle(item) }}</h3>
            <div class="text-muted mt-0.5 flex items-center gap-2 text-sm">
              <span>{{ formatDate(item.publishedAt) }}</span>
              <span v-if="item.slug" class="truncate opacity-60">/ {{ item.slug }}</span>
            </div>
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
                class="rounded-full px-2 py-0.5 text-xs"
              >
                {{ item.active ? 'Activo' : 'Inactivo' }}
              </span>
              <span
                v-if="item.pdfUrl"
                class="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs"
              >
                PDF
              </span>
              <span
                v-if="item.mediaOutlet"
                class="bg-info/10 text-info rounded-full px-2 py-0.5 text-xs"
              >
                {{ item.mediaOutlet.name }}
              </span>
              <span
                v-for="pressTag in item.tags"
                :key="pressTag.id"
                class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
              >
                {{ getTagName(pressTag.tag) }}
              </span>
              <span v-if="!item.tags.length" class="text-muted text-xs italic">
                Sin etiquetas
              </span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <UButton
              :to="`${typeUrlPrefix[item.type]}/${item.slug}`"
              icon="i-tabler-external-link"
              variant="ghost"
              size="sm"
              target="_blank"
              title="Ver página"
            />
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
          <h3 class="font-medium">{{ getItemTitle(item) }}</h3>
          <NuxtImg
            :src="item.image"
            :alt="getItemTitle(item)"
            width="320"
            height="180"
            class="w-full rounded-lg object-cover"
          />
          <div class="text-muted flex items-center gap-2 text-sm">
            <span>{{ formatDate(item.publishedAt) }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <span
              :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.active ? 'Activo' : 'Inactivo' }}
            </span>
            <span
              v-if="item.pdfUrl"
              class="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs"
            >
              PDF
            </span>
            <span
              v-if="item.mediaOutlet"
              class="bg-info/10 text-info rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.mediaOutlet.name }}
            </span>
            <span
              v-for="pressTag in item.tags"
              :key="pressTag.id"
              class="bg-secondary/10 text-secondary rounded-full px-2 py-0.5 text-xs"
            >
              {{ getTagName(pressTag.tag) }}
            </span>
          </div>
          <div class="flex justify-end gap-2">
            <UButton
              :to="`${typeUrlPrefix[item.type]}/${item.slug}`"
              icon="i-tabler-external-link"
              variant="ghost"
              size="sm"
              target="_blank"
            />
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

      <div v-if="!items.length" class="text-muted py-12 text-center">
        No hay {{ currentType ? typeLabels[currentType].toLowerCase() : 'artículos de prensa' }}
      </div>
    </div>

    <!-- Edit/Create Modal -->
    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-2xl' }">
      <template #content>
        <div class="flex max-h-[80vh] flex-col">
          <div class="overflow-y-auto p-6">
            <h2 class="mb-4 text-lg font-bold">
              {{ editingItem ? 'Editar artículo' : 'Nuevo artículo' }}
            </h2>

            <form id="press-form" class="space-y-4" @submit.prevent="handleSubmit">
              <!-- Type selector (only when creating) -->
              <UFormField v-if="!editingItem" label="Tipo de artículo">
                <USelectMenu
                  v-model="form.type"
                  :items="Object.entries(typeLabels).map(([value, label]) => ({ value, label }))"
                  value-key="value"
                  class="w-full"
                />
              </UFormField>

              <!-- Cover image upload -->
              <UFormField label="Imagen de portada *">
                <div class="space-y-3">
                  <div
                    v-if="imagePreview"
                    class="bg-muted/30 flex items-center justify-center rounded-lg border p-2"
                  >
                    <img
                      :src="imagePreview"
                      alt="Vista previa de la imagen"
                      class="max-h-40 max-w-full rounded object-contain"
                    />
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
                    @click="triggerImageInput"
                  >
                    {{ imagePreview ? 'Cambiar imagen' : 'Subir imagen' }}
                  </UButton>
                </div>
              </UFormField>

              <!-- PDF upload (press_release and statement only) -->
              <UFormField
                v-if="form.type === 'press_release' || form.type === 'statement'"
                label="Documento PDF *"
              >
                <div class="space-y-3">
                  <div
                    v-if="pdfName"
                    class="bg-muted/30 flex items-center gap-2 rounded-lg border p-3"
                  >
                    <UIcon name="i-tabler-file-type-pdf" class="text-error size-6" />
                    <span class="flex-1 truncate text-sm">{{ pdfName }}</span>
                  </div>
                  <input
                    ref="pdfInputRef"
                    type="file"
                    accept=".pdf"
                    class="hidden"
                    @change="handlePdfSelect"
                  />
                  <UButton
                    type="button"
                    variant="outline"
                    icon="i-tabler-upload"
                    :loading="isUploadingPdf"
                    @click="triggerPdfInput"
                  >
                    {{ pdfName ? 'Cambiar PDF' : 'Subir PDF' }}
                  </UButton>
                </div>
              </UFormField>

              <!-- External URL (media_appearance only) -->
              <UFormField v-if="form.type === 'media_appearance'" label="Enlace a la noticia *">
                <UInput v-model="form.externalUrl" placeholder="https://..." class="w-full" />
              </UFormField>

              <!-- Media outlet selector (media_appearance only) -->
              <UFormField v-if="form.type === 'media_appearance'" label="Medio de comunicación *">
                <USelectMenu
                  :model-value="form.mediaOutletId ?? undefined"
                  :items="mediaOutletSelectItems"
                  value-key="value"
                  class="w-full"
                  placeholder="Selecciona un medio..."
                  @update:model-value="form.mediaOutletId = $event ?? null"
                />
              </UFormField>

              <!-- Tags -->
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

              <!-- Translations -->
              <div
                v-for="trans in form.translations"
                :key="trans.locale"
                class="rounded-lg border p-4"
              >
                <h4 class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
                  {{ getLocaleName(trans.locale) }}
                  <span v-if="trans.locale !== 'es'" class="text-muted text-xs">(opcional)</span>
                </h4>
                <div class="space-y-3">
                  <UFormField :label="trans.locale === 'es' ? 'Título *' : 'Título'">
                    <UInput
                      v-model="trans.title"
                      class="w-full"
                      :required="trans.locale === 'es'"
                    />
                  </UFormField>
                  <UFormField
                    :label="trans.locale === 'es' ? 'Descripción breve *' : 'Descripción breve'"
                  >
                    <UTextarea
                      v-model="trans.description"
                      class="w-full"
                      :rows="2"
                      placeholder="Breve resumen del artículo para SEO y listados"
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
            <UButton type="submit" form="press-form" :loading="isSubmitting">
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
            ¿Estás seguro de que deseas eliminar "{{ getItemTitle(itemToDelete!) }}"? Esta acción no
            se puede deshacer.
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
