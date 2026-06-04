<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { createFinancialReportSchema } from '~~/shared/utils/adminSchemas'
import {
  calendarDateLikeToDateOnly,
  dateValueToDateOnly,
  parseDateOnlyString,
} from '~~/shared/utils/date'

definePageMeta({
  layout: 'admin',
  title: 'Informes económicos',
})

interface FinancialReportTranslation {
  locale: string
  title: string
}

interface FinancialReport {
  id: string
  pdfUrl: string
  approvedAt: string
  order: number
  active: boolean
  createdAt: string
  updatedAt: string
  translations: FinancialReportTranslation[]
}

const toast = useToast()
const { refreshAllClientAsyncData } = usePublicCmsCacheRefresh()
const { clearErrors, getFieldError, validate } = useFormValidation()
const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  filterNonEmptyTranslations,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const {
  data,
  error: fetchError,
  pending,
  refresh,
} = await useFetch<{
  data: FinancialReport[]
}>('/api/admin/financial-reports', {
  lazy: true,
})
const sortFinancialReports = (left: FinancialReport, right: FinancialReport) => {
  const rightApprovedAt = new Date(right.approvedAt).getTime() || 0
  const leftApprovedAt = new Date(left.approvedAt).getTime() || 0

  if (leftApprovedAt !== rightApprovedAt) {
    return rightApprovedAt - leftApprovedAt
  }

  return right.id.localeCompare(left.id, 'es')
}

const { items, prependItem, removeItem, replaceItem } = useAdminMutableCollection(data, {
  sortItems: sortFinancialReports,
})
const isSubmitting = ref(false)
const isDeleting = ref(false)
const MAX_FINANCIAL_REPORT_PDF_SIZE = 20 * 1024 * 1024

const pdfUpload = useAdminDocumentUpload({
  endpoint: '/api/admin/financial-reports/upload',
  successMessage: 'PDF subido correctamente',
  errorMessage: 'No se pudo subir el PDF',
  maxFileSizeBytes: MAX_FINANCIAL_REPORT_PDF_SIZE,
  maxFileSizeMessage: 'El PDF supera el tamaño máximo (20MB)',
  onUploaded: (storagePath) => {
    form.pdfUrl = storagePath
  },
})
const { formatDate: formatLocaleDate } = useLocaleFormatting()

const today = new Date()
const approvedAt = shallowRef(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
)

const createEmptyTranslationSet = () =>
  createEmptyTranslations<FinancialReportTranslation>({
    title: '',
  })

const form = reactive({
  pdfUrl: '',
  order: 0,
  active: true,
  translations: createEmptyTranslationSet(),
})

const buildPayload = () => ({
  pdfUrl: form.pdfUrl,
  order: form.order,
  active: form.active,
  approvedAt: calendarDateToDateOnly(approvedAt.value),
  translations: filterNonEmptyTranslations(form.translations, 'title'),
})

const buildPayloadSnapshot = () =>
  JSON.stringify({
    ...buildPayload(),
    translations: buildPayload().translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
    })),
  })

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
} = useAdminCollectionState<FinancialReport>({
  items,
  prepareCreate: () => {
    clearErrors()
    form.pdfUrl = ''
    form.order = items.value.length
    form.active = true
    form.translations = createEmptyTranslationSet()
    pdfUpload.setFile(null)
    approvedAt.value = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
    resetFormSnapshot()
  },
  prepareEdit: (item) => {
    clearErrors()
    form.pdfUrl = item.pdfUrl
    form.order = item.order
    form.active = item.active
    form.translations = mapTranslationsToForm(item.translations, {
      title: '',
    }) as FinancialReportTranslation[]
    pdfUpload.setFile(item.pdfUrl)
    approvedAt.value = valueToCalendarDate(item.approvedAt)
    resetFormSnapshot()
  },
})

const calendarDateToDateOnly = (date: CalendarDate) => calendarDateLikeToDateOnly(date)

const valueToCalendarDate = (value: string): CalendarDate => {
  const normalizedDate = parseDateOnlyString(dateValueToDateOnly(value))

  if (!normalizedDate) {
    return new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  }

  return new CalendarDate(normalizedDate.year, normalizedDate.month, normalizedDate.day)
}

function formatDate(iso: string) {
  return formatLocaleDate(iso, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function getReportTitle(item: FinancialReport | null) {
  if (!item) return ''

  return getDefaultTranslationValue(item.translations, 'title') || item.translations[0]?.title || ''
}

function getAdditionalTranslationCount(item: FinancialReport) {
  return item.translations.filter(
    (translation) => !isDefaultLocale(translation.locale) && translation.title.trim()
  ).length
}

function getAdditionalTranslationLabel(item: FinancialReport) {
  const count = getAdditionalTranslationCount(item)
  if (count === 0) return ''
  return `${count} idioma adicional${count > 1 ? 'es' : ''}`
}

const handleSubmit = async () => {
  const payload = buildPayload()

  if (editingItem.value && !hasFormChanges.value) {
    closeModal()
    clearErrors()
    return
  }

  if (!validate(createFinancialReportSchema, payload)) {
    return
  }

  isSubmitting.value = true
  try {
    if (editingItem.value) {
      const response = await $fetch<{ data: FinancialReport }>(
        `/api/admin/financial-reports/${editingItem.value.id}`,
        {
          method: 'PUT',
          body: {
            ...payload,
            updatedAt: editingItem.value.updatedAt,
          },
        }
      )
      replaceItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: 'Informe actualizado', color: 'success' })
    } else {
      const response = await $fetch<{ data: FinancialReport }>('/api/admin/financial-reports', {
        method: 'POST',
        body: payload,
      })
      prependItem(response.data)
      await refreshAllClientAsyncData()
      toast.add({ title: 'Informe creado', color: 'success' })
    }

    closeModal()
    clearErrors()
  } catch (error) {
    toast.add({ title: getApiErrorMessage(error, 'No se pudo guardar el informe'), color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/financial-reports/${itemToDelete.value.id}`, {
      method: 'DELETE',
    })
    removeItem(itemToDelete.value.id)
    await refreshAllClientAsyncData()
    toast.add({ title: 'Informe eliminado', color: 'success' })
    closeDeleteModal()
  } catch (error) {
    toast.add({
      title: getApiErrorMessage(error, 'No se pudo eliminar el informe'),
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
      <div>
        <h1 class="text-2xl font-bold">Informes Económicos</h1>
        <p class="text-muted mt-1 text-sm">
          Gestiona los informes económicos de CREUP aprobados por la Asamblea General.
        </p>
      </div>
      <UButton icon="i-tabler-plus" @click="openCreate">Nuevo informe</UButton>
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
        title="No se pudieron cargar los informes"
        description="Revisa la conexión y vuelve a intentarlo."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <UCard v-else-if="items.length === 0" class="text-center">
      <div class="flex flex-col items-center gap-3 py-8">
        <UIcon name="i-tabler-file-analytics" class="text-muted size-10" />
        <p class="text-muted">No hay informes económicos todavía.</p>
        <UButton variant="soft" icon="i-tabler-plus" @click="openCreate">
          Crear primer informe
        </UButton>
      </div>
    </UCard>

    <div v-else class="space-y-3">
      <UCard v-for="item in items" :key="item.id">
        <div class="flex flex-col gap-4 md:flex-row md:items-center">
          <div class="flex min-w-0 flex-1 items-center gap-4">
            <UIcon name="i-tabler-file-type-pdf" class="text-primary size-8 shrink-0" />

            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <p class="truncate font-medium">{{ getReportTitle(item) }}</p>
                <UBadge :color="item.active ? 'success' : 'neutral'" variant="subtle" size="sm">
                  {{ item.active ? 'Activo' : 'Inactivo' }}
                </UBadge>
              </div>
              <div class="mt-1 flex flex-wrap items-center gap-2">
                <p class="text-muted text-sm">Aprobado el {{ formatDate(item.approvedAt) }}</p>
                <UBadge
                  v-if="getAdditionalTranslationCount(item) > 0"
                  color="info"
                  variant="subtle"
                  size="sm"
                >
                  {{ getAdditionalTranslationLabel(item) }}
                </UBadge>
              </div>
              <p class="text-muted text-sm break-all">{{ item.pdfUrl }}</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 md:justify-end">
            <UButton
              :href="item.pdfUrl"
              external
              target="_blank"
              rel="noopener noreferrer"
              variant="outline"
              icon="i-tabler-external-link"
              size="sm"
            >
              Ver PDF
            </UButton>
            <UButton
              variant="ghost"
              icon="i-tabler-edit"
              size="sm"
              aria-label="Editar informe"
              @click="openEdit(item)"
            />
            <UButton
              variant="ghost"
              color="error"
              icon="i-tabler-trash"
              size="sm"
              aria-label="Eliminar informe"
              @click="confirmDelete(item)"
            />
          </div>
        </div>
      </UCard>
    </div>

    <UModal v-model:open="showModal" :ui="{ content: 'sm:max-w-xl' }">
      <template #content>
        <div class="p-6">
          <h2 class="mb-2 text-lg font-bold">
            {{ editingItem ? 'Editar informe' : 'Nuevo informe económico' }}
          </h2>
          <p class="text-muted mb-6 text-sm">
            El título en español es obligatorio. El resto de idiomas son opcionales.
          </p>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <div class="space-y-4">
              <div
                v-for="(translation, index) in form.translations"
                :key="translation.locale"
                class="rounded-lg border p-4"
              >
                <div class="mb-3 flex items-center gap-2 font-medium">
                  <UIcon :name="getLocaleFlag(translation.locale)" class="size-5" />
                  <span>{{ getLocaleName(translation.locale) }}</span>
                  <UBadge
                    v-if="isDefaultLocale(translation.locale)"
                    color="primary"
                    variant="subtle"
                    size="sm"
                  >
                    Obligatorio
                  </UBadge>
                  <span v-else class="text-muted text-xs">(opcional)</span>
                </div>

                <UFormField
                  :label="isDefaultLocale(translation.locale) ? 'Título *' : 'Título'"
                  :error="getFieldError(`translations.${index}.title`)"
                >
                  <UInput
                    v-model="translation.title"
                    class="w-full"
                    :placeholder="
                      isDefaultLocale(translation.locale)
                        ? 'Informe Económico de...'
                        : 'Economic Report for...'
                    "
                  />
                </UFormField>
              </div>
            </div>

            <UFormField label="Fecha de aprobación *" :error="getFieldError('approvedAt')">
              <UInputDate v-model="approvedAt" class="w-full" />
            </UFormField>

            <UFormField label="Documento PDF *" :error="getFieldError('pdfUrl')">
              <div
                v-if="pdfUpload.fileName"
                class="bg-muted/30 mb-2 flex items-center gap-2 rounded-lg border p-3"
              >
                <UIcon name="i-tabler-file-type-pdf" class="text-error size-5 shrink-0" />
                <span class="flex-1 truncate text-sm">{{ pdfUpload.fileName }}</span>
              </div>
              <input
                :ref="pdfUpload.inputRef"
                type="file"
                accept=".pdf"
                class="hidden"
                @change="pdfUpload.handleFileSelect"
              />
              <UButton
                type="button"
                variant="outline"
                icon="i-tabler-upload"
                size="sm"
                block
                :loading="pdfUpload.isUploading.value"
                @click="pdfUpload.triggerFileDialog"
              >
                {{ pdfUpload.fileName ? 'Cambiar PDF' : 'Subir PDF' }}
              </UButton>
            </UFormField>

            <UFormField label="Estado">
              <div class="flex items-center gap-2">
                <USwitch v-model="form.active" />
                <span class="text-sm">{{ form.active ? 'Activo' : 'Inactivo' }}</span>
              </div>
            </UFormField>

            <div class="flex justify-end gap-2 pt-2">
              <UButton variant="ghost" @click="showModal = false">Cancelar</UButton>
              <UButton
                type="submit"
                :loading="isSubmitting"
                :disabled="Boolean(editingItem) && !hasFormChanges"
              >
                {{ editingItem ? 'Guardar cambios' : 'Crear informe' }}
              </UButton>
            </div>
          </form>
        </div>
      </template>
    </UModal>

    <UModal v-model:open="showDeleteModal" :ui="{ content: 'sm:max-w-sm' }">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div class="bg-error/10 flex size-10 shrink-0 items-center justify-center rounded-full">
              <UIcon name="i-tabler-alert-triangle" class="text-error size-6" />
            </div>
            <h2 class="text-lg font-bold">Eliminar informe</h2>
          </div>
          <p class="text-muted mb-1 text-sm">¿Seguro que quieres eliminar este informe?</p>
          <p v-if="itemToDelete" class="mb-6 text-sm font-medium">
            {{ getReportTitle(itemToDelete) }}
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
