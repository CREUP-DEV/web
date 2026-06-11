<script setup lang="ts">
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
import {
  NEWSLETTER_MAX_IMAGE_SIZE,
  NEWSLETTER_MAX_PDF_SIZE,
} from '~~/shared/constants/newsletterUpload'
import { createNewsletterRequestSchema } from '~~/shared/utils/adminSchemas'
import type { Newsletter } from '@/composables/admin/useAdminNewsletters'

definePageMeta({
  layout: 'admin',
  title: 'Newsletter',
})

const { t } = useI18n()
const toast = useAdminToast()
const route = useRoute()
const router = useRouter()
const localePath = useLocalePath()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  fetchError,
  pending,
  refresh,
  items,
  prependItem,
  removeItem,
  replaceItem,
  updateMeta,
  maxDeliveryAttempts,
  toNewsletterListItem,
  sendingItemId,
  itemToManualSend,
  showManualSendModal,
  confirmManualSend,
  handleManualSend,
  itemToCancel,
  showCancelModal,
  isCancelling,
  confirmCancel,
  handleCancelSend,
} = useAdminNewsletters()

const isSubmitting = ref(false)
const isDeleting = ref(false)

const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/newsletter/upload',
  successMessage: t('admin.newsletter.list.imageUploaded'),
  errorMessage: t('admin.newsletter.list.imageUploadFailed'),
  maxFileSizeBytes: NEWSLETTER_MAX_IMAGE_SIZE,
  maxFileSizeMessage: t('admin.newsletter.list.imageTooLarge'),
  onUploaded: (storagePath) => {
    form.coverImage = storagePath
  },
  getFallbackPreview: () => form.coverImage || null,
})
const pdfUpload = useAdminDocumentUpload({
  endpoint: '/api/admin/newsletter/upload',
  successMessage: t('admin.newsletter.list.pdfUploaded'),
  errorMessage: t('admin.newsletter.list.pdfUploadFailed'),
  maxFileSizeBytes: NEWSLETTER_MAX_PDF_SIZE,
  maxFileSizeMessage: t('admin.newsletter.list.pdfTooLarge'),
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

  if (!validate(createNewsletterRequestSchema, basePayload)) {
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
      await refreshAllClientAsyncData()
      toast.add({ title: t('admin.newsletter.list.updatedToast'), color: 'success' })
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
      await refreshAllClientAsyncData()
      const msg = emailQueued
        ? t('admin.newsletter.list.createdSendingToast')
        : t('admin.newsletter.list.createdToast')
      toast.add({ title: msg, color: 'success' })
    }
    closeModal()
    clearErrors()
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletter.list.saveErrorToast')),
      color: 'error',
    })
  } finally {
    isSubmitting.value = false
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
    await refreshAllClientAsyncData()
    closeDeleteModal()
    toast.add({ title: t('admin.newsletter.list.deletedToast'), color: 'success' })
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, t('admin.newsletter.list.deleteErrorToast')),
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
    return t('admin.common.save')
  }
  if (isSubmitting.value && form.sendEmail) {
    return t('admin.newsletter.list.creatingSending')
  }
  return t('admin.common.create')
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
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold">{{ t('admin.newsletter.list.title') }}</h1>
      <div class="flex gap-2">
        <UButton
          :to="localePath(ADMIN_ROUTES.newsletterSubscribers)"
          icon="i-tabler-users"
          variant="outline"
        >
          {{ t('admin.newsletter.list.subscribersButton') }}
        </UButton>
        <UButton icon="i-tabler-plus" @click="openCreate">{{ t('admin.common.add') }}</UButton>
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
        :title="t('admin.newsletter.list.loadErrorTitle')"
        :description="t('admin.common.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <div v-else-if="items.length === 0" class="text-muted py-12 text-center">
      {{ t('admin.newsletter.list.empty') }}
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
          <div class="text-muted mt-0.5 text-sm">
            {{ t('admin.newsletter.list.createdOn', { date: formatDate(item.createdAt) }) }}
          </div>
          <div v-if="item.sentAt" class="text-muted mt-0.5 text-sm">
            {{ t('admin.newsletter.list.sentOn', { date: formatDate(item.sentAt) }) }}
          </div>
          <div v-else-if="item.isSending" class="text-muted mt-0.5 text-sm">
            <template v-if="item.lastDeliveryTotal !== null && item.lastDeliveryTotal > 0">
              {{
                t('admin.newsletter.list.sendingProgress', {
                  sent: item.lastDeliverySentCount ?? 0,
                  total: item.lastDeliveryTotal,
                })
              }}
            </template>
            <template v-else>{{ t('admin.newsletter.list.sendingNow') }}</template>
          </div>
          <div v-else class="text-muted mt-0.5 text-sm">
            {{ t('admin.newsletter.list.pendingSend') }}
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-2">
            <span
              :class="item.publicVisible ? 'bg-primary/10 text-primary' : 'bg-muted text-muted'"
              class="rounded-full px-2 py-0.5 text-xs"
            >
              {{
                item.publicVisible
                  ? t('admin.newsletter.list.visibleBadge')
                  : t('admin.newsletter.list.hiddenBadge')
              }}
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
              {{
                item.isSending
                  ? t('admin.newsletter.list.sendingBadge')
                  : item.sentAt
                    ? t('admin.newsletter.list.sentBadge')
                    : t('admin.newsletter.list.pendingBadge')
              }}
            </span>
            <a
              :href="item.pdfUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="bg-warning/10 text-warning rounded-full px-2 py-0.5 text-xs hover:underline"
            >
              PDF <span class="sr-only">{{ t('admin.newsletter.list.opensNewTab') }}</span>
            </a>
          </div>
          <!-- Delivery stats: shown once a delivery has been attempted -->
          <div
            v-if="item.lastDeliverySentCount !== null || item.lastDeliveryErrorCount !== null"
            class="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs"
          >
            <span class="text-muted">
              <span class="font-medium">{{ item.lastDeliverySentCount ?? 0 }}</span>
              {{ t('admin.newsletter.list.sentCount') }}
            </span>
            <span v-if="(item.lastDeliveryErrorCount ?? 0) > 0" class="text-error font-medium">
              {{ t('admin.newsletter.list.failedCount', { count: item.lastDeliveryErrorCount }) }}
            </span>
            <UTooltip
              v-if="(item.lastDeliveryErrorCount ?? 0) > 0"
              :text="t('admin.newsletter.list.failedTooltip', { max: maxDeliveryAttempts })"
            >
              <UIcon
                name="i-tabler-info-circle"
                class="text-error size-3.5 cursor-help"
                :aria-label="t('admin.newsletter.list.failedAria')"
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
            :aria-label="
              t('admin.newsletter.list.cancelSendAria', { month: formatMonth(item.monthKey) })
            "
            :title="t('admin.newsletter.list.cancelSend')"
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
              !item.publicVisible ? t('admin.newsletter.list.sendRequiresVisible') : undefined
            "
            :aria-label="t('admin.newsletter.list.sendAria', { month: formatMonth(item.monthKey) })"
            @click="confirmManualSend(item)"
          />
          <UButton
            icon="i-tabler-pencil"
            variant="ghost"
            size="sm"
            :aria-label="t('admin.newsletter.list.editAria', { month: formatMonth(item.monthKey) })"
            @click="openEdit(item)"
          />
          <UButton
            icon="i-tabler-trash"
            variant="ghost"
            color="error"
            size="sm"
            :aria-label="
              t('admin.newsletter.list.deleteAria', { month: formatMonth(item.monthKey) })
            "
            @click="confirmDelete(item)"
          />
        </div>
      </div>
    </div>

    <UModal
      v-model:open="showModal"
      :title="
        editingItem ? t('admin.newsletter.list.editTitle') : t('admin.newsletter.list.newTitle')
      "
    >
      <template #body>
        <form class="space-y-5" @submit.prevent="handleSubmit">
          <UFormField
            :label="`${t('admin.newsletter.list.monthLabel')} *`"
            :error="getFieldError('month')"
          >
            <AdminNewsletterMonthPicker
              v-model="form.month"
              :disabled-months="reservedMonthKeys"
              :taken="isSelectedMonthTaken"
            />
          </UFormField>

          <UFormField
            :label="`${t('admin.newsletter.list.coverImageLabel')} ${t('admin.common.optional')}`"
            :description="t('admin.newsletter.list.coverImageDescription')"
            :error="getFieldError('coverImage')"
          >
            <div class="flex items-center gap-4">
              <div
                role="button"
                tabindex="0"
                class="bg-muted flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border"
                :aria-label="t('admin.newsletter.list.selectCoverImageAria')"
                @click="imageUpload.triggerFileDialog"
                @keydown.enter="imageUpload.triggerFileDialog"
                @keydown.space.prevent="imageUpload.triggerFileDialog"
              >
                <img
                  v-if="imageUpload.preview.value"
                  :src="imageUpload.preview.value"
                  :alt="t('admin.newsletter.list.coverPreviewAlt')"
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
                {{
                  imageUpload.preview.value
                    ? t('admin.newsletter.list.changeImage')
                    : t('admin.newsletter.list.uploadImage')
                }}
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
                {{ t('admin.newsletter.list.removeImage') }}
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

          <UFormField
            :label="`${t('admin.newsletter.list.pdfLabel')} *`"
            :error="getFieldError('pdfUrl')"
          >
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
                {{
                  pdfUpload.fileName.value
                    ? t('admin.newsletter.list.changePdf')
                    : t('admin.newsletter.list.uploadPdf')
                }}
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

          <UFormField :label="t('admin.newsletter.list.visibleLabel')">
            <USwitch v-model="form.publicVisible" />
            <template #hint>
              <span class="text-dimmed text-xs">
                {{ t('admin.newsletter.list.visibleHint') }}
              </span>
            </template>
          </UFormField>

          <UFormField v-if="!editingItem" :label="t('admin.newsletter.list.sendEmailLabel')">
            <USwitch v-model="form.sendEmail" />
            <template #hint>
              <span class="text-dimmed text-xs">
                {{ t('admin.newsletter.list.sendEmailHint') }}
              </span>
            </template>
          </UFormField>

          <div class="flex justify-end gap-2 pt-2">
            <UButton variant="outline" @click="closeModal">{{ t('admin.common.cancel') }}</UButton>
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

    <UModal v-model:open="showManualSendModal" :title="t('admin.newsletter.list.sendModalTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-primary/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-send" class="text-primary size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.newsletter.list.sendModalTitle') }}</h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.newsletter.list.sendConfirmPrefix') }}
            <strong>{{ itemToManualSend ? formatMonth(itemToManualSend.monthKey) : '' }}</strong
            >{{ t('admin.newsletter.list.sendConfirmSuffix') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showManualSendModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton
              color="primary"
              :loading="Boolean(itemToManualSend && sendingItemId === itemToManualSend.id)"
              @click="handleManualSend"
            >
              {{ t('admin.newsletter.list.sendNow') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showCancelModal" :title="t('admin.newsletter.list.cancelSend')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-player-stop" class="text-warning size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.newsletter.list.cancelSend') }}</h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.newsletter.list.cancelConfirmPrefix') }}
            <strong>{{ itemToCancel ? formatMonth(itemToCancel.monthKey) : '' }}</strong
            >{{ t('admin.newsletter.list.cancelConfirmSuffix') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCancelModal = false">{{
              t('admin.newsletter.list.back')
            }}</UButton>
            <UButton color="error" :loading="isCancelling" @click="handleCancelSend">
              {{ t('admin.newsletter.list.cancelSend') }}
            </UButton>
          </div>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" :title="t('admin.newsletter.list.deleteModalTitle')">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">{{ t('admin.newsletter.list.deleteModalTitle') }}</h2>
          </div>
          <p class="text-muted mb-6">
            {{ t('admin.newsletter.list.deleteConfirmPrefix') }}
            <strong>{{ itemToDelete ? formatMonth(itemToDelete.monthKey) : '' }}</strong
            >{{ t('admin.newsletter.list.deleteConfirmSuffix') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showDeleteModal = false">{{
              t('admin.common.cancel')
            }}</UButton>
            <UButton color="error" :loading="isDeleting" @click="handleDelete">{{
              t('admin.common.delete')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
