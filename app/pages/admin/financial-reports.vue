<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
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
  translations: FinancialReportTranslation[]
}

const toast = useToast()
const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  filterNonEmptyTranslations,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const { data, refresh } = await useFetch<{ items: FinancialReport[] }>(
  '/api/admin/financial-reports'
)
const items = computed(() => data.value?.items ?? [])

const showModal = ref(false)
const editingItem = ref<FinancialReport | null>(null)
const isSubmitting = ref(false)

const showDeleteModal = ref(false)
const itemToDelete = ref<FinancialReport | null>(null)
const isDeleting = ref(false)

const pdfInputRef = ref<HTMLInputElement | null>(null)
const pdfName = ref<string | null>(null)
const isUploadingPdf = ref(false)
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

function getRequiredTitle(translations: FinancialReportTranslation[]) {
  return getDefaultTranslationValue(translations, 'title')?.trim() ?? ''
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

const openCreate = () => {
  editingItem.value = null
  form.pdfUrl = ''
  form.order = items.value.length
  form.active = true
  form.translations = createEmptyTranslationSet()
  pdfName.value = null
  approvedAt.value = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  showModal.value = true
}

const openEdit = (item: FinancialReport) => {
  editingItem.value = item
  form.pdfUrl = item.pdfUrl
  form.order = item.order
  form.active = item.active
  form.translations = mapTranslationsToForm(item.translations, {
    title: '',
  }) as FinancialReportTranslation[]
  pdfName.value = item.pdfUrl.split('/').pop() ?? null
  approvedAt.value = valueToCalendarDate(item.approvedAt)
  showModal.value = true
}

const handleSubmit = async () => {
  if (!getRequiredTitle(form.translations)) {
    toast.add({ title: 'El título en español es obligatorio', color: 'error' })
    return
  }

  if (!form.pdfUrl) {
    toast.add({ title: 'Debes subir un PDF', color: 'error' })
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      pdfUrl: form.pdfUrl,
      order: form.order,
      active: form.active,
      approvedAt: calendarDateToDateOnly(approvedAt.value),
      translations: filterNonEmptyTranslations(form.translations, 'title'),
    }

    if (editingItem.value) {
      await $fetch(`/api/admin/financial-reports/${editingItem.value.id}`, {
        method: 'PUT',
        body: payload,
      })
      toast.add({ title: 'Informe actualizado', color: 'success' })
    } else {
      await $fetch('/api/admin/financial-reports', {
        method: 'POST',
        body: payload,
      })
      toast.add({ title: 'Informe creado', color: 'success' })
    }

    showModal.value = false
    await refresh()
  } catch {
    toast.add({ title: 'No se pudo guardar el informe', color: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

const confirmDelete = (item: FinancialReport) => {
  itemToDelete.value = item
  showDeleteModal.value = true
}

const handleDelete = async () => {
  if (!itemToDelete.value) return

  isDeleting.value = true
  try {
    await $fetch(`/api/admin/financial-reports/${itemToDelete.value.id}`, {
      method: 'DELETE',
    })
    toast.add({ title: 'Informe eliminado', color: 'success' })
    showDeleteModal.value = false
    itemToDelete.value = null
    await refresh()
  } catch {
    toast.add({ title: 'No se pudo eliminar el informe', color: 'error' })
  } finally {
    isDeleting.value = false
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

    const result = await $fetch<{ path: string; storagePath: string }>(
      '/api/admin/financial-reports/upload',
      {
        method: 'POST',
        body: formData,
      }
    )

    form.pdfUrl = result.storagePath
    toast.add({ title: 'PDF subido correctamente', color: 'success' })
  } catch {
    pdfName.value = null
    toast.add({ title: 'No se pudo subir el PDF', color: 'error' })
  } finally {
    isUploadingPdf.value = false
    target.value = ''
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

    <UCard v-if="items.length === 0" class="text-center">
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
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-2 md:justify-end">
            <UButton
              :href="item.pdfUrl"
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
                v-for="translation in form.translations"
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

                <UFormField :label="isDefaultLocale(translation.locale) ? 'Título *' : 'Título'">
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

            <UFormField label="Fecha de aprobación *">
              <UInputDate v-model="approvedAt" class="w-full" />
            </UFormField>

            <UFormField label="Documento PDF *">
              <div
                v-if="pdfName"
                class="bg-muted/30 mb-2 flex items-center gap-2 rounded-lg border p-3"
              >
                <UIcon name="i-tabler-file-type-pdf" class="text-error size-5 shrink-0" />
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
                size="sm"
                block
                :loading="isUploadingPdf"
                @click="triggerPdfInput"
              >
                {{ pdfName ? 'Cambiar PDF' : 'Subir PDF' }}
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
              <UButton type="submit" :loading="isSubmitting">
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
