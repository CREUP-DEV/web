<script setup lang="ts">
definePageMeta({ layout: 'admin' })

interface Newsletter {
  id: string
  month: string
  monthKey: string
  coverImage: string
  pdfUrl: string
  active: boolean
  sending: boolean
  sentAt: string | null
  createdAt: string
}

const toast = useToast()
const route = useRoute()
const router = useRouter()

const { data, refresh } = await useFetch<{ items: Newsletter[] }>('/api/admin/newsletter')
const items = computed(() => data.value?.items ?? [])

const showModal = ref(false)
const editingItem = ref<Newsletter | null>(null)
const isSubmitting = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<Newsletter | null>(null)
const isDeleting = ref(false)
const sendingItemId = ref<string | null>(null)

const imageInputRef = ref<HTMLInputElement | null>(null)
const imagePreview = ref<string | null>(null)
const isUploadingImage = ref(false)
const pdfInputRef = ref<HTMLInputElement | null>(null)
const pdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)

const form = reactive({
  month: '',
  coverImage: '',
  pdfUrl: '',
  active: true,
  sendEmail: false,
})

const pickerYear = ref(new Date().getFullYear())
const monthNames = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
]

function padMonth(month: number) {
  return String(month).padStart(2, '0')
}

function buildMonthValue(year: number, monthIndex: number) {
  return `${year}-${padMonth(monthIndex + 1)}-01`
}

function getMonthKey(value: string) {
  return value.slice(0, 7)
}

function buildMonthDate(monthKey: string) {
  return new Date(`${monthKey}-01T00:00:00.000Z`)
}

const reservedMonthKeys = computed(() => {
  const currentId = editingItem.value?.id

  return new Set(items.value.filter((item) => item.id !== currentId).map((item) => item.monthKey))
})

const selectedMonth = computed(() => (form.month ? Number(form.month.slice(5, 7)) - 1 : -1))
const selectedYear = computed(() => (form.month ? Number(form.month.slice(0, 4)) : -1))
const isSelectedMonthTaken = computed(
  () => Boolean(form.month) && reservedMonthKeys.value.has(getMonthKey(form.month))
)

function pickMonth(monthIndex: number) {
  form.month = buildMonthValue(pickerYear.value, monthIndex)
}

function isMonthDisabled(monthIndex: number): boolean {
  const now = new Date()
  const monthKey = `${pickerYear.value}-${padMonth(monthIndex + 1)}`

  return (
    pickerYear.value > now.getFullYear() ||
    (pickerYear.value === now.getFullYear() && monthIndex > now.getMonth()) ||
    reservedMonthKeys.value.has(monthKey)
  )
}

function formatMonth(monthKey: string) {
  const label = buildMonthDate(monthKey).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const statusMessage =
      'statusMessage' in error && typeof error.statusMessage === 'string' ? error.statusMessage : ''

    const dataMessage =
      'data' in error &&
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof error.data.message === 'string'
        ? error.data.message
        : ''

    return dataMessage || statusMessage || fallback
  }

  return fallback
}

function getDefaultMonthValue() {
  const now = new Date()

  for (let monthIndex = now.getMonth(); monthIndex >= 0; monthIndex--) {
    const monthValue = buildMonthValue(now.getFullYear(), monthIndex)

    if (!reservedMonthKeys.value.has(getMonthKey(monthValue))) {
      return monthValue
    }
  }

  return buildMonthValue(now.getFullYear(), now.getMonth())
}

function openCreate() {
  editingItem.value = null
  const now = new Date()
  form.month = getDefaultMonthValue()
  form.coverImage = ''
  form.pdfUrl = ''
  form.active = true
  form.sendEmail = false
  pickerYear.value = Number(form.month.slice(0, 4)) || now.getFullYear()
  imagePreview.value = null
  pdfName.value = null
  showModal.value = true
}

async function openCreateFromQuery() {
  if (route.query.open !== 'create') return

  openCreate()

  const nextQuery = { ...route.query }
  delete nextQuery.open

  await router.replace({ query: nextQuery })
}

function openEdit(item: Newsletter) {
  editingItem.value = item
  form.month = `${item.monthKey}-01`
  form.coverImage = item.coverImage
  form.pdfUrl = item.pdfUrl
  form.active = item.active
  form.sendEmail = false
  pickerYear.value = Number(item.monthKey.slice(0, 4))
  imagePreview.value = item.coverImage || null
  pdfName.value = item.pdfUrl ? (item.pdfUrl.split('/').pop() ?? null) : null
  showModal.value = true
}

function triggerImageInput() {
  imageInputRef.value?.click()
}

async function handleImageSelect(event: Event) {
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
    const fd = new FormData()
    fd.append('file', file)
    const result = await $fetch<{ path: string; storagePath: string }>(
      '/api/admin/newsletter/upload',
      {
        method: 'POST',
        body: fd,
      }
    )
    form.coverImage = result.storagePath
    toast.add({ title: 'Imagen subida correctamente', color: 'success' })
  } catch {
    imagePreview.value = null
    toast.add({ title: 'No se pudo subir la imagen', color: 'error' })
  } finally {
    isUploadingImage.value = false
    if (target) target.value = ''
  }
}

function triggerPdfInput() {
  pdfInputRef.value?.click()
}

async function handlePdfSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  pdfName.value = file.name
  isUploadingPdf.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const result = await $fetch<{ path: string; storagePath: string }>(
      '/api/admin/newsletter/upload',
      {
        method: 'POST',
        body: fd,
      }
    )
    form.pdfUrl = result.storagePath
    toast.add({ title: 'PDF subido correctamente', color: 'success' })
  } catch {
    pdfName.value = null
    toast.add({ title: 'No se pudo subir el PDF', color: 'error' })
  } finally {
    isUploadingPdf.value = false
    if (target) target.value = ''
  }
}

// Submit
async function handleSubmit() {
  isSubmitting.value = true
  try {
    if (editingItem.value) {
      await $fetch(`/api/admin/newsletter/${editingItem.value.id}`, {
        method: 'PUT',
        body: {
          month: form.month,
          coverImage: form.coverImage,
          pdfUrl: form.pdfUrl,
          active: form.active,
        },
      })
      toast.add({ title: 'Newsletter actualizada', color: 'success' })
    } else {
      const response = await $fetch<{ emailQueued: boolean }>('/api/admin/newsletter', {
        method: 'POST',
        body: {
          month: form.month,
          coverImage: form.coverImage,
          pdfUrl: form.pdfUrl,
          active: form.active,
          sendEmail: form.sendEmail,
        },
      })
      const msg = response.emailQueued ? 'Newsletter creada y envío iniciado' : 'Newsletter creada'
      toast.add({ title: msg, color: 'success' })
    }
    showModal.value = false
    await refresh()
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'No se pudo guardar la newsletter'),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

async function handleManualSend(item: Newsletter) {
  sendingItemId.value = item.id

  try {
    await $fetch<{ queued: boolean }>(`/api/admin/newsletter/${item.id}/send`, {
      method: 'POST',
    })

    toast.add({ title: 'Envío iniciado', color: 'success' })

    await refresh()
  } catch (error) {
    toast.add({
      title: getErrorMessage(error, 'No se pudo enviar la newsletter'),
      color: 'error',
    })
  } finally {
    sendingItemId.value = null
  }
}

// Delete
function confirmDelete(item: Newsletter) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

async function handleDelete() {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/newsletter/${itemToDelete.value.id}`, { method: 'DELETE' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
    toast.add({ title: 'Newsletter eliminada', color: 'success' })
  } catch {
    toast.add({ title: 'No se pudo eliminar la newsletter', color: 'error' })
  } finally {
    isDeleting.value = false
  }
}

const canSubmit = computed(
  () =>
    form.coverImage &&
    form.pdfUrl &&
    form.month &&
    !isSubmitting.value &&
    !isSelectedMonthTaken.value
)

watch(
  () => route.query.open,
  async () => {
    await openCreateFromQuery()
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Newsletter</h1>
      <div class="flex gap-2">
        <UButton to="/admin/newsletter/subscribers" icon="i-tabler-users" variant="outline">
          Suscriptores
        </UButton>
        <UButton icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
      </div>
    </div>

    <div v-if="items.length === 0" class="text-muted py-12 text-center">
      No hay newsletters. Pulsa «Añadir» para crear la primera.
    </div>

    <div class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-surface flex items-center gap-4 rounded-xl p-4 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-800/50"
      >
        <img
          :src="item.coverImage"
          :alt="formatMonth(item.monthKey)"
          class="size-20 rounded-lg object-cover"
          loading="lazy"
        />
        <div class="flex-1 overflow-hidden">
          <h3 class="font-medium">{{ formatMonth(item.monthKey) }}</h3>
          <div class="text-muted mt-0.5 text-sm">Creada {{ formatDate(item.createdAt) }}</div>
          <div v-if="item.sentAt" class="text-muted mt-0.5 text-sm">
            Enviada {{ formatDate(item.sentAt) }}
          </div>
          <div v-else-if="item.sending" class="text-muted mt-0.5 text-sm">Enviándose ahora</div>
          <div v-else class="text-muted mt-0.5 text-sm">Pendiente de envío</div>
          <div class="mt-1 flex items-center gap-2">
            <span
              :class="item.active ? 'bg-success/10 text-success' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.active ? 'Activa' : 'Inactiva' }}
            </span>
            <span
              :class="
                item.sending
                  ? 'bg-primary/10 text-primary'
                  : item.sentAt
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
              "
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.sending ? 'Enviándose' : item.sentAt ? 'Ya enviada' : 'Pendiente' }}
            </span>
            <a
              :href="item.pdfUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs hover:underline"
            >
              PDF <span class="sr-only">(se abre en nueva pestaña)</span>
            </a>
          </div>
        </div>
        <div class="flex gap-1">
          <UButton
            v-if="!item.sentAt"
            icon="i-tabler-send"
            variant="ghost"
            size="sm"
            :loading="sendingItemId === item.id || item.sending"
            :disabled="!item.active || item.sending || sendingItemId === item.id"
            :aria-label="`Enviar newsletter de ${formatMonth(item.monthKey)}`"
            @click="handleManualSend(item)"
          />
          <UButton
            icon="i-tabler-pencil"
            variant="ghost"
            size="sm"
            :aria-label="`Editar newsletter de ${formatMonth(item.monthKey)}`"
            @click="openEdit(item)"
          />
          <UButton
            icon="i-tabler-trash"
            variant="ghost"
            color="error"
            size="sm"
            :aria-label="`Eliminar newsletter de ${formatMonth(item.monthKey)}`"
            @click="confirmDelete(item)"
          />
        </div>
      </div>
    </div>

    <UModal v-model:open="showModal">
      <template #header>
        <h2 class="text-lg font-semibold">
          {{ editingItem ? 'Editar newsletter' : 'Nueva newsletter' }}
        </h2>
      </template>
      <template #body>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <UFormField label="Mes *">
            <div class="rounded-lg border p-3" role="group" aria-label="Selector de mes y año">
              <div class="mb-2 flex items-center justify-between">
                <UButton
                  icon="i-tabler-chevron-left"
                  variant="ghost"
                  size="sm"
                  aria-label="Año anterior"
                  @click="pickerYear--"
                />
                <span class="text-sm font-semibold">{{ pickerYear }}</span>
                <UButton
                  icon="i-tabler-chevron-right"
                  variant="ghost"
                  size="sm"
                  :disabled="pickerYear >= new Date().getFullYear()"
                  aria-label="Año siguiente"
                  @click="pickerYear++"
                />
              </div>
              <div class="grid grid-cols-4 gap-1">
                <button
                  v-for="(name, idx) in monthNames"
                  :key="idx"
                  type="button"
                  :disabled="isMonthDisabled(idx)"
                  :aria-pressed="selectedMonth === idx && selectedYear === pickerYear"
                  class="rounded-md px-2 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                  :class="[
                    selectedMonth === idx && selectedYear === pickerYear
                      ? 'bg-primary text-inverted'
                      : 'hover:bg-elevated',
                  ]"
                  @click="pickMonth(idx)"
                >
                  {{ name }}
                </button>
              </div>
            </div>
            <template #hint>
              <span :class="isSelectedMonthTaken ? 'text-error' : 'text-dimmed'" class="text-xs">
                {{
                  isSelectedMonthTaken
                    ? 'Ya existe una newsletter para ese mes.'
                    : 'Solo se permite una newsletter por mes.'
                }}
              </span>
            </template>
          </UFormField>

          <UFormField label="Imagen de portada *">
            <div class="flex items-center gap-4">
              <div
                role="button"
                tabindex="0"
                class="bg-muted flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border"
                aria-label="Seleccionar imagen de portada"
                @click="triggerImageInput"
                @keydown.enter="triggerImageInput"
                @keydown.space.prevent="triggerImageInput"
              >
                <img
                  v-if="imagePreview"
                  :src="imagePreview"
                  alt="Portada"
                  class="size-full object-cover"
                />
                <UIcon v-else name="i-tabler-photo-plus" class="text-muted size-8" />
              </div>
              <UButton
                variant="outline"
                size="sm"
                :loading="isUploadingImage"
                @click="triggerImageInput"
              >
                {{ imagePreview ? 'Cambiar imagen' : 'Subir imagen' }}
              </UButton>
              <input
                ref="imageInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleImageSelect"
              />
            </div>
          </UFormField>

          <UFormField label="PDF *">
            <div class="flex items-center gap-4">
              <UIcon
                :name="pdfName ? 'i-tabler-file-check' : 'i-tabler-file-upload'"
                class="size-8"
                :class="pdfName ? 'text-success' : 'text-muted'"
              />
              <span v-if="pdfName" class="truncate text-sm">{{ pdfName }}</span>
              <UButton
                variant="outline"
                size="sm"
                :loading="isUploadingPdf"
                @click="triggerPdfInput"
              >
                {{ pdfName ? 'Cambiar PDF' : 'Subir PDF' }}
              </UButton>
              <input
                ref="pdfInputRef"
                type="file"
                accept=".pdf"
                class="hidden"
                @change="handlePdfSelect"
              />
            </div>
          </UFormField>

          <UFormField label="Activa">
            <USwitch v-model="form.active" />
          </UFormField>

          <UFormField v-if="!editingItem" label="Enviar correo a suscriptores">
            <USwitch v-model="form.sendEmail" />
            <template #hint>
              <span class="text-dimmed text-xs">
                Si no se envía ahora, podrás hacerlo manualmente una sola vez más adelante.
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="outline" @click="showModal = false">Cancelar</UButton>
            <UButton type="submit" :loading="isSubmitting" :disabled="!canSubmit">
              {{ editingItem ? 'Guardar' : 'Crear' }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">Eliminar newsletter</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Seguro que quieres eliminar la newsletter de
            <strong>{{ itemToDelete ? formatMonth(itemToDelete.monthKey) : '' }}</strong
            >? Esta acción no se puede deshacer.
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
