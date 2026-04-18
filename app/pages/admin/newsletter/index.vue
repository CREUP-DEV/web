<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import { createNewsletterRequestClientSchema } from '~~/shared/utils/adminClientSchemas'

definePageMeta({
  layout: 'admin',
  title: 'Newsletter',
})

interface Newsletter {
  id: string
  month: string
  monthKey: string
  coverImage: string | null
  pdfUrl: string
  publicVisible: boolean
  isSending: boolean
  sentAt: string | null
  createdAt: string
  updatedAt: string
  lastDeliverySentCount: number | null
  lastDeliveryTotal: number | null
  lastDeliveryErrorCount: number | null
}

/** Aligns a newsletter row from API (POST/GET) with list `Newsletter` shape including `isSending`. */
function toNewsletterListItem(raw: Record<string, unknown>): Newsletter {
  return {
    id: String(raw.id),
    monthKey: String(raw.monthKey),
    month: String(raw.month),
    coverImage: (raw.coverImage as string | null) ?? null,
    pdfUrl: String(raw.pdfUrl),
    publicVisible: Boolean(raw.publicVisible),
    isSending: Boolean(raw.isSending),
    sentAt: (raw.sentAt as string | null) ?? null,
    createdAt: String(raw.createdAt),
    updatedAt: String(raw.updatedAt),
    lastDeliverySentCount:
      raw.lastDeliverySentCount != null ? Number(raw.lastDeliverySentCount) : null,
    lastDeliveryTotal: raw.lastDeliveryTotal != null ? Number(raw.lastDeliveryTotal) : null,
    lastDeliveryErrorCount:
      raw.lastDeliveryErrorCount != null ? Number(raw.lastDeliveryErrorCount) : null,
  }
}

const toast = useToast()
const route = useRoute()
const router = useRouter()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: Newsletter[]
  meta: {
    total: number
    maxDeliveryAttempts: number
  }
}>('/api/admin/newsletter', {
  lazy: true,
})
const sortNewsletters = (left: Newsletter, right: Newsletter) => {
  const rightMonth = new Date(right.month).getTime() || 0
  const leftMonth = new Date(left.month).getTime() || 0

  if (leftMonth !== rightMonth) {
    return rightMonth - leftMonth
  }

  return right.id.localeCompare(left.id, 'es')
}

const { items, prependItem, removeItem, replaceItem, updateItem, updateMeta } =
  useAdminMutableCollection(data, {
    sortItems: sortNewsletters,
  })
const maxDeliveryAttempts = computed(() => data.value?.meta.maxDeliveryAttempts ?? 3)
const isSubmitting = ref(false)
const isDeleting = ref(false)
const isCancelling = ref(false)
const sendingItemId = ref<string | null>(null)
const itemToManualSend = ref<Newsletter | null>(null)
const showManualSendModal = ref(false)
const itemToCancel = ref<Newsletter | null>(null)
const showCancelModal = ref(false)
let sendingRefreshTimer: ReturnType<typeof setInterval> | null = null

const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/newsletter/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    form.coverImage = storagePath
  },
  getFallbackPreview: () => form.coverImage || null,
})
const pdfUpload = useAdminDocumentUpload({
  endpoint: '/api/admin/newsletter/upload',
  onUploaded: (storagePath) => {
    form.pdfUrl = storagePath
  },
})

const form = reactive({
  month: '',
  coverImage: '',
  pdfUrl: '',
  publicVisible: true,
  sendEmail: false,
})

const buildPayload = () => ({
  month: form.month,
  coverImage: form.coverImage.trim() || null,
  pdfUrl: form.pdfUrl,
  publicVisible: form.publicVisible,
  sendEmail: form.sendEmail,
})

const buildPayloadSnapshot = () => JSON.stringify(buildPayload())

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildPayloadSnapshot)

const {
  closeDeleteModal,
  closeModal,
  confirmDelete,
  editingItem,
  itemToDelete,
  openCreate,
  openEdit,
  showDeleteModal,
  showModal,
} = useAdminCollectionState<Newsletter>({
  items,
  prepareCreate: () => {
    clearErrors()
    form.month = getDefaultMonthValue()
    form.coverImage = ''
    form.pdfUrl = ''
    form.publicVisible = true
    form.sendEmail = false
    imageUpload.setPreview(null)
    pdfUpload.setFile(null)
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.month = `${item.monthKey}-01`
    form.coverImage = item.coverImage ?? ''
    form.pdfUrl = item.pdfUrl
    form.publicVisible = item.publicVisible
    form.sendEmail = false
    imageUpload.setPreview(item.coverImage || null)
    pdfUpload.setFile(item.pdfUrl)
    resetFormSnapshot()
  },
})

function buildMonthValue(year: number, monthIndex: number) {
  const mm = String(monthIndex + 1).padStart(2, '0')
  return `${year}-${mm}-01`
}

function getMonthKey(value: string) {
  return value.slice(0, 7)
}

function buildMonthDate(monthKey: string) {
  const [yearStr, monthStr] = monthKey.split('-')
  return new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1))
}

const reservedMonthKeys = computed(() => {
  const currentId = editingItem.value?.id
  return new Set(items.value.filter((item) => item.id !== currentId).map((item) => item.monthKey))
})

const isSelectedMonthTaken = computed(
  () => Boolean(form.month) && reservedMonthKeys.value.has(getMonthKey(form.month))
)

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

async function openCreateFromQuery() {
  if (route.query.open !== 'create') return

  openCreate()

  const nextQuery = { ...route.query }
  delete nextQuery.open

  await router.replace({ query: nextQuery })
}

// Submit
async function handleSubmit() {
  const basePayload = buildPayload()

  if (editingItem.value && !hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createNewsletterRequestClientSchema, basePayload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: Record<string, unknown> }>(
        `/api/admin/newsletter/${editingItem.value.id}`,
        {
          method: 'PUT',
          body: {
            month: form.month,
            coverImage: basePayload.coverImage,
            pdfUrl: form.pdfUrl,
            publicVisible: form.publicVisible,
            updatedAt: editingItem.value.updatedAt,
          },
        }
      )
      if (response.data) {
        replaceItem(toNewsletterListItem(response.data))
      }
      toast.add({ title: 'Newsletter actualizada', color: 'success' })
    } else {
      const response = await $fetch<{
        data?: {
          item?: Record<string, unknown>
          emailQueued?: boolean
        }
      }>('/api/admin/newsletter', {
        method: 'POST',
        body: {
          month: form.month,
          coverImage: basePayload.coverImage,
          pdfUrl: form.pdfUrl,
          publicVisible: form.publicVisible,
          sendEmail: form.sendEmail,
        },
      })
      const emailQueued = response.data?.emailQueued ?? false
      if (response.data?.item) {
        prependItem(toNewsletterListItem(response.data.item))
        updateMeta((meta) => ({
          total: (meta?.total ?? 0) + 1,
          maxDeliveryAttempts: meta?.maxDeliveryAttempts ?? 3,
        }))
      }
      if (emailQueued) {
        await refresh()
      }
      const msg = emailQueued ? 'Newsletter creada y envío iniciado' : 'Newsletter creada'
      toast.add({ title: msg, color: 'success' })
    }
    closeModal()
    clearErrors()
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo guardar la newsletter'),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
  }
}

function confirmManualSend(item: Newsletter) {
  itemToManualSend.value = item
  showManualSendModal.value = true
}

async function handleManualSend() {
  if (!itemToManualSend.value) return

  const item = itemToManualSend.value
  sendingItemId.value = item.id

  try {
    await $fetch<{
      data?: {
        queued?: boolean
      }
      queued?: boolean
    }>(`/api/admin/newsletter/${item.id}/send`, {
      method: 'POST',
    })

    updateItem(item.id, (current) => ({
      ...current,
      isSending: true,
    }))
    await refresh()
    showManualSendModal.value = false
    itemToManualSend.value = null
    toast.add({ title: 'Envío iniciado', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo enviar la newsletter'),
      color: 'error',
    })
  } finally {
    sendingItemId.value = null
  }
}

function confirmCancel(item: Newsletter) {
  itemToCancel.value = item
  showCancelModal.value = true
}

async function handleCancelSend() {
  if (!itemToCancel.value) return
  isCancelling.value = true
  try {
    await $fetch(`/api/admin/newsletter/${itemToCancel.value.id}/send`, { method: 'DELETE' })
    updateItem(itemToCancel.value.id, (current) => ({
      ...current,
      isSending: false,
    }))
    showCancelModal.value = false
    itemToCancel.value = null
    toast.add({ title: 'Envío cancelado', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo cancelar el envío'),
      color: 'error',
    })
  } finally {
    isCancelling.value = false
  }
}

async function handleDelete() {
  if (!itemToDelete.value) return
  const newsletterToDelete = itemToDelete.value
  isDeleting.value = true
  try {
    await $fetch(`/api/admin/newsletter/${newsletterToDelete.id}`, { method: 'DELETE' })
    removeItem(newsletterToDelete.id)
    updateMeta((meta) => ({
      total: Math.max(0, (meta?.total ?? 0) - 1),
      maxDeliveryAttempts: meta?.maxDeliveryAttempts ?? 3,
    }))
    closeDeleteModal()
    toast.add({ title: 'Newsletter eliminada', color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo eliminar la newsletter'),
      color: 'error',
    })
  } finally {
    isDeleting.value = false
  }
}

const canSubmit = computed(
  () => form.pdfUrl && form.month && !isSubmitting.value && !isSelectedMonthTaken.value
)

const createSubmitButtonLabel = computed(() => {
  if (editingItem.value) {
    return 'Guardar'
  }
  if (isSubmitting.value && form.sendEmail) {
    return 'Creando e iniciando envío…'
  }
  return 'Crear'
})

watch(
  () => form.sendEmail,
  (val) => {
    if (val) form.publicVisible = true
  }
)

watch(
  () => route.query.open,
  async () => {
    await openCreateFromQuery()
  },
  { immediate: true }
)

onMounted(() => {
  sendingRefreshTimer = setInterval(() => {
    if (items.value.some((item) => item.isSending)) {
      void refresh()
    }
  }, 10_000)
})

onBeforeUnmount(() => {
  if (sendingRefreshTimer) {
    clearInterval(sendingRefreshTimer)
    sendingRefreshTimer = null
  }
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">Newsletter</h1>
      <div class="flex gap-2">
        <UButton :to="ADMIN_ROUTES.newsletterSubscribers" icon="i-tabler-users" variant="outline">
          Suscriptores
        </UButton>
        <UButton icon="i-tabler-plus" @click="openCreate">Añadir</UButton>
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
        title="No se pudieron cargar las newsletters"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <div v-else-if="items.length === 0" class="text-muted py-12 text-center">
      No hay newsletters. Pulsa «Añadir» para crear la primera.
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in items"
        :key="item.id"
        class="bg-surface ring-default flex items-center gap-4 rounded-xl p-4 shadow-sm ring-1"
      >
        <img
          v-if="item.coverImage"
          :src="item.coverImage"
          :alt="formatMonth(item.monthKey)"
          class="size-20 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
        <div
          v-else
          class="bg-muted text-muted flex size-20 shrink-0 items-center justify-center rounded-lg"
          aria-hidden="true"
        >
          <UIcon name="i-tabler-news" class="size-12 opacity-80" />
        </div>
        <div class="flex-1 overflow-hidden">
          <h3 class="font-medium">{{ formatMonth(item.monthKey) }}</h3>
          <div class="text-muted mt-0.5 text-sm">Creada {{ formatDate(item.createdAt) }}</div>
          <div v-if="item.sentAt" class="text-muted mt-0.5 text-sm">
            Enviada {{ formatDate(item.sentAt) }}
          </div>
          <div v-else-if="item.isSending" class="text-muted mt-0.5 text-sm">
            <template v-if="item.lastDeliveryTotal !== null && item.lastDeliveryTotal > 0">
              Enviando {{ item.lastDeliverySentCount ?? 0 }} de {{ item.lastDeliveryTotal }}
            </template>
            <template v-else>Enviándose ahora</template>
          </div>
          <div v-else class="text-muted mt-0.5 text-sm">Pendiente de envío</div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span
              :class="item.publicVisible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.publicVisible ? 'Visible en web' : 'Oculta en web' }}
            </span>
            <span
              :class="
                item.isSending
                  ? 'bg-primary/10 text-primary'
                  : item.sentAt
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
              "
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{ item.isSending ? 'Enviándose' : item.sentAt ? 'Ya enviada' : 'Pendiente' }}
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
          <!-- Delivery stats: shown once a delivery has been attempted -->
          <div
            v-if="item.lastDeliverySentCount !== null || item.lastDeliveryErrorCount !== null"
            class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"
          >
            <span class="text-muted">
              <span class="font-medium">{{ item.lastDeliverySentCount ?? 0 }}</span> enviados
            </span>
            <span v-if="(item.lastDeliveryErrorCount ?? 0) > 0" class="text-error font-medium">
              {{ item.lastDeliveryErrorCount }} fallidos
            </span>
            <UTooltip
              v-if="(item.lastDeliveryErrorCount ?? 0) > 0"
              :text="`Los envíos fallidos no se reintentan automáticamente (máx. ${maxDeliveryAttempts} intentos por destinatario). Usa el botón de envío manual para volver a intentarlo.`"
            >
              <UIcon
                name="i-tabler-info-circle"
                class="text-error size-3.5 cursor-help"
                aria-label="Los envíos fallidos requieren reenvío manual"
              />
            </UTooltip>
          </div>
        </div>
        <div class="flex gap-1">
          <UButton
            v-if="item.isSending"
            icon="i-tabler-player-stop"
            variant="ghost"
            color="error"
            size="sm"
            :loading="isCancelling && itemToCancel?.id === item.id"
            :aria-label="`Cancelar envío de newsletter de ${formatMonth(item.monthKey)}`"
            title="Cancelar envío"
            @click="confirmCancel(item)"
          />
          <UButton
            v-else-if="!item.sentAt"
            icon="i-tabler-send"
            variant="ghost"
            size="sm"
            :loading="sendingItemId === item.id"
            :disabled="!item.publicVisible || sendingItemId === item.id"
            :title="
              !item.publicVisible ? 'Debe estar visible en la web para poder enviarla' : undefined
            "
            :aria-label="`Enviar newsletter de ${formatMonth(item.monthKey)}`"
            @click="confirmManualSend(item)"
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
          <UFormField label="Mes *" :error="getFieldError('month')">
            <AdminNewsletterMonthPicker
              v-model="form.month"
              :disabled-months="reservedMonthKeys"
              :taken="isSelectedMonthTaken"
            />
          </UFormField>

          <UFormField
            label="Imagen de portada (opcional)"
            description="Si la dejas vacía, se usará la portada por defecto del sitio."
            :error="getFieldError('coverImage')"
          >
            <div class="flex items-center gap-4">
              <div
                role="button"
                tabindex="0"
                class="bg-muted flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border"
                aria-label="Seleccionar imagen de portada"
                @click="imageUpload.triggerFileDialog"
                @keydown.enter="imageUpload.triggerFileDialog"
                @keydown.space.prevent="imageUpload.triggerFileDialog"
              >
                <img
                  v-if="imageUpload.preview.value"
                  :src="imageUpload.preview.value"
                  alt="Portada"
                  class="size-full object-cover"
                />
                <UIcon v-else name="i-tabler-photo-plus" class="text-muted size-8" />
              </div>
              <UButton
                variant="outline"
                size="sm"
                :loading="imageUpload.isUploading.value"
                @click="imageUpload.triggerFileDialog"
              >
                {{ imageUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
              </UButton>
              <UButton
                v-if="form.coverImage"
                variant="ghost"
                color="error"
                size="sm"
                type="button"
                @click="
                  () => {
                    form.coverImage = ''
                    imageUpload.setPreview(null)
                  }
                "
              >
                Quitar
              </UButton>
              <input
                :ref="imageUpload.inputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="imageUpload.handleFileSelect"
              />
            </div>
          </UFormField>

          <UFormField label="PDF *" :error="getFieldError('pdfUrl')">
            <div class="flex items-center gap-4">
              <UIcon
                :name="pdfUpload.fileName.value ? 'i-tabler-file-check' : 'i-tabler-file-upload'"
                class="size-8"
                :class="pdfUpload.fileName.value ? 'text-success' : 'text-muted'"
              />
              <span v-if="pdfUpload.fileName.value" class="truncate text-sm">{{
                pdfUpload.fileName.value
              }}</span>
              <UButton
                variant="outline"
                size="sm"
                :loading="pdfUpload.isUploading.value"
                @click="pdfUpload.triggerFileDialog"
              >
                {{ pdfUpload.fileName.value ? 'Cambiar PDF' : 'Subir PDF' }}
              </UButton>
              <input
                :ref="pdfUpload.inputRef"
                type="file"
                accept=".pdf"
                class="hidden"
                @change="pdfUpload.handleFileSelect"
              />
            </div>
          </UFormField>

          <UFormField label="Visible en la web">
            <USwitch v-model="form.publicVisible" />
            <template #hint>
              <span class="text-dimmed text-xs">
                Necesario para que los suscriptores puedan descargarla.
              </span>
            </template>
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
            <UButton variant="outline" @click="closeModal">Cancelar</UButton>
            <UButton
              type="submit"
              :loading="isSubmitting"
              :disabled="!canSubmit || (Boolean(editingItem) && !hasFormChanges)"
            >
              {{ createSubmitButtonLabel }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <UModal v-model:open="showManualSendModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-send" class="text-primary size-6" />
            </div>
            <h2 class="text-lg font-bold">Confirmar envío</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Seguro que quieres enviar la newsletter de
            <strong>{{ itemToManualSend ? formatMonth(itemToManualSend.monthKey) : '' }}</strong
            >? Esta acción iniciará el envío a todos los suscriptores activos.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showManualSendModal = false">Cancelar</UButton>
            <UButton
              color="primary"
              :loading="Boolean(itemToManualSend && sendingItemId === itemToManualSend.id)"
              @click="handleManualSend"
            >
              Enviar ahora
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showCancelModal">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-player-stop" class="text-warning size-6" />
            </div>
            <h2 class="text-lg font-bold">Cancelar envío</h2>
          </div>
          <p class="text-muted mb-6">
            ¿Seguro que quieres cancelar el envío de la newsletter de
            <strong>{{ itemToCancel ? formatMonth(itemToCancel.monthKey) : '' }}</strong
            >? Los correos ya enviados no se revertirán.
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCancelModal = false">Volver</UButton>
            <UButton color="error" :loading="isCancelling" @click="handleCancelSend">
              Cancelar envío
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
