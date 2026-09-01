<script setup lang="ts">
import type { AdminAreaReport } from '@/composables/admin/useAdminAreaReports'
import { pickLocalizedValue } from '~~/shared/utils/locale'
import { areaReportClientSchema } from './activityFormSchema'

// Form-local translation shape: all fields are strings (the rich-text editor + inputs need string
// models). API/null values are normalised to '' on populate; '' -> null when building the payload.
interface AreaReportFormTranslation {
  locale: string
  contentHtml: string
  imageCaption: string
  alt: string
}

export interface AdminArea {
  id: number
  name: string
  nameTranslations: Record<string, string>
  order: number
  active: boolean
  mandateId: number
  mandateStartDate: string
  mandateEndDate: string | null
}

const props = defineProps<{
  /** The report being edited, or null when creating */
  report?: AdminAreaReport | null
  /** Whether the form is currently submitting */
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  cancel: []
}>()

const { t, locale } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const { createEmptyTranslations, fallbackLocale } = useLocales()
const { clearErrors, getFieldError, validate } = useFormValidation()

const {
  activeLocale,
  activeIndex,
  idPrefix,
  status,
  invalidLocales,
  revealFirstInvalidLocale,
  panelId,
  panelLabelledBy,
} = useAdminLocaleTabs(
  computed(() => form.translations),
  ['contentHtml'],
  getFieldError
)

const isEditing = computed(() => !!props.report)

const hasUnsavedChanges = ref(false)
defineExpose({ hasUnsavedChanges })
const isHydratingForm = ref(false)

const MAX_AREA_REPORT_IMAGE_SIZE = 5 * 1024 * 1024

const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/area-reports/upload',
  successMessage: t('admin.areaReports.form.imageUploaded'),
  errorMessage: t('admin.areaReports.form.imageUploadError'),
  maxFileSizeBytes: MAX_AREA_REPORT_IMAGE_SIZE,
  maxFileSizeMessage: t('admin.areaReports.form.imageTooLarge'),
  onUploaded: (storagePath) => {
    clearErrors()
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
})

const form = reactive({
  /** 'YYYY-MM' anchor month (end of the covered range). */
  monthKey: '',
  /** 'YYYY-MM' optional range start; empty = single month. */
  coversFrom: '',
  areaId: null as number | null,
  image: '',
  active: true,
  translations: createEmptyTranslations<AreaReportFormTranslation>({
    contentHtml: '',
    imageCaption: '',
    alt: '',
  }),
})

// Supporting data: org-chart areas for the area dropdown. Only needed when creating — the area is
// fixed at creation and never re-resolved on edit, so skip the fetch entirely when editing.
//
// The month drives the query: a report is written against the areas that existed while it was
// being reported on, not today's. A month the hand-over falls inside returns both mandates.
const { data: areasData, error: areasError } = await useFetch<{ data: AdminArea[] }>(
  '/api/admin/areas',
  {
    headers: localeApiHeaders,
    immediate: !props.report,
    query: computed(() => ({ month: form.monthKey || undefined })),
  }
)
const areas = computed(() => areasData.value?.data ?? [])

// Moving to a month from another mandate swaps the areas on offer. A selection that is not in the
// new list has to go: left in place it no longer matches any option, so the select falls back to
// rendering the raw id.
watch(areas, (available) => {
  if (isHydratingForm.value || available.length === 0 || form.areaId === null) return

  if (!available.some((area) => area.id === form.areaId)) {
    form.areaId = null
  }
})

const hasCoversFrom = ref(false)

// AdminMonthPicker emits 'YYYY-MM-01'; monthKey/coversFrom are 'YYYY-MM'. Convert at boundary.
const toMonthKey = (value: string) => (value ? value.slice(0, 7) : '')
const fromMonthKey = (value: string) => (value ? `${value}-01` : '')

const monthPickerValue = computed({
  get: () => fromMonthKey(form.monthKey),
  set: (value: string) => {
    form.monthKey = toMonthKey(value)
  },
})
const coversFromPickerValue = computed({
  get: () => fromMonthKey(form.coversFrom),
  set: (value: string) => {
    form.coversFrom = toMonthKey(value)
  },
})

const { formatDate } = useLocaleFormatting()

const mandateLabel = (area: AdminArea) =>
  area.mandateEndDate
    ? t('admin.areaReports.form.mandateGroup', {
        start: formatDate(area.mandateStartDate, { year: 'numeric', month: 'short' }),
        end: formatDate(area.mandateEndDate, { year: 'numeric', month: 'short' }),
      })
    : t('admin.areaReports.form.mandateGroupCurrent', {
        start: formatDate(area.mandateStartDate, { year: 'numeric', month: 'short' }),
      })

// Grouped by mandate rather than by an active/historical flag: when a month straddles the
// hand-over both mandates come back, and the group heading is what tells them apart.
type AreaSelectItem = { type?: 'label'; label: string; value?: number }

const areaSelectItems = computed<AreaSelectItem[][]>(() => {
  const byMandate = new Map<number, AdminArea[]>()
  for (const area of areas.value) {
    byMandate.set(area.mandateId, [...(byMandate.get(area.mandateId) ?? []), area])
  }

  return [...byMandate.values()]
    .sort((left, right) => right[0]!.mandateStartDate.localeCompare(left[0]!.mandateStartDate))
    .map((group) => [
      { type: 'label', label: mandateLabel(group[0]!) },
      ...group
        .sort((left, right) => left.order - right.order)
        .map((area) => ({ value: area.id, label: area.name })),
    ])
})

const buildFormSnapshot = () =>
  JSON.stringify({
    monthKey: form.monthKey,
    coversFrom: hasCoversFrom.value ? form.coversFrom : '',
    areaId: form.areaId,
    image: form.image,
    active: form.active,
    translations: form.translations.map((translation) => ({
      locale: translation.locale,
      contentHtml: translation.contentHtml,
      imageCaption: translation.imageCaption,
      alt: translation.alt,
    })),
  })

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildFormSnapshot)

const resetUnsavedChangesBaseline = () => {
  resetFormSnapshot()
  hasUnsavedChanges.value = false
}

const clearImage = () => {
  form.image = ''
  imageUpload.setPreview(null)
  clearErrors()
}

const toggleCoversFrom = (enabled: boolean) => {
  hasCoversFrom.value = enabled
  if (!enabled) form.coversFrom = ''
}

const buildPayload = () => ({
  monthKey: form.monthKey,
  coversFrom: hasCoversFrom.value && form.coversFrom ? form.coversFrom : null,
  areaId: form.areaId,
  image: form.image?.trim() || null,
  active: form.active,
  translations: form.translations.map((translation) => ({
    locale: translation.locale,
    contentHtml: translation.contentHtml || null,
    imageCaption: translation.imageCaption?.trim() || null,
    alt: translation.alt?.trim() || null,
  })),
})

// The area dropdown is required only when creating; an area-load failure must not block editing
// an existing report (its area is fixed).
const canSubmit = computed(() => isEditing.value || !areasError.value)
const submitDisabledReason = computed(() =>
  canSubmit.value ? '' : t('admin.areaReports.form.areasLoadError')
)

const handleSubmit = () => {
  if (!canSubmit.value) return
  if (isEditing.value && !hasUnsavedChanges.value) return

  const payload = buildPayload()
  if (!validate(areaReportClientSchema, payload)) {
    revealFirstInvalidLocale()
    return
  }

  emit('submit', payload)
}

const populateForm = (report: AdminAreaReport) => {
  isHydratingForm.value = true
  clearErrors()
  form.monthKey = report.monthKey
  form.coversFrom = report.edition?.coversFrom ?? ''
  hasCoversFrom.value = Boolean(report.edition?.coversFrom)
  form.areaId = report.areaId
  form.image = report.image ?? ''
  form.active = report.active
  imageUpload.setPreview(report.image || null)
  form.translations = report.translations.length
    ? createEmptyTranslations<AreaReportFormTranslation>({
        contentHtml: '',
        imageCaption: '',
        alt: '',
      }).map((empty) => {
        const existing = report.translations.find((item) => item.locale === empty.locale)
        if (!existing) return empty
        return {
          locale: empty.locale,
          contentHtml: existing.contentHtml ?? '',
          imageCaption: existing.imageCaption ?? '',
          alt: existing.alt ?? '',
        }
      })
    : form.translations
  nextTick(() => {
    resetUnsavedChangesBaseline()
    isHydratingForm.value = false
  })
}

watch(
  () => props.report,
  (report) => {
    if (report) populateForm(report)
  },
  { immediate: true }
)

watch(hasFormChanges, (value) => {
  if (isHydratingForm.value) return
  hasUnsavedChanges.value = value
})

const snapshotAreaName = computed(() => {
  const snapshot = props.report?.areaNameSnapshot
  if (!snapshot) return null
  // Resolve the frozen area name in the admin's active locale (with fallback), like the public side.
  return pickLocalizedValue(snapshot, locale.value, fallbackLocale) ?? null
})

const showCancelModal = ref(false)
const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    showCancelModal.value = true
  } else {
    emit('cancel')
  }
}
const confirmCancel = () => {
  showCancelModal.value = false
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <UAlert
      v-if="!isEditing && areasError"
      color="error"
      variant="soft"
      :title="t('admin.areaReports.form.areasLoadError')"
      :description="t('admin.areaReports.form.areasLoadErrorDescription')"
      class="mb-6"
    />

    <div
      class="bg-background/80 sticky top-0 z-10 -mx-1 mb-6 flex items-center justify-between gap-4 border-b px-1 py-3 backdrop-blur-sm"
    >
      <div class="flex min-w-0 items-center gap-3">
        <UButton
          type="button"
          variant="ghost"
          icon="i-tabler-arrow-left"
          size="sm"
          @click="handleCancel"
        >
          {{ t('admin.areaReports.form.back') }}
        </UButton>
        <USeparator orientation="vertical" class="h-5 shrink-0" />
        <span class="text-muted truncate text-sm">
          {{
            isEditing
              ? t('admin.areaReports.form.editingLabel')
              : t('admin.areaReports.form.newLabel')
          }}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          type="submit"
          icon="i-tabler-check"
          :loading="submitting"
          :disabled="!canSubmit || submitting || (isEditing && !hasUnsavedChanges)"
          :title="submitDisabledReason || undefined"
        >
          {{
            isEditing
              ? t('admin.areaReports.form.saveChanges')
              : t('admin.areaReports.form.createReport')
          }}
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div class="min-w-0 space-y-6">
        <AdminLocaleTabs
          v-model="activeLocale"
          :id-prefix="idPrefix"
          :status="status"
          :invalid-locales="invalidLocales"
        />

        <AdminActivityAreaReportTranslationCard
          v-for="(trans, index) in form.translations"
          v-show="index === activeIndex"
          :id="panelId(trans.locale)"
          :key="trans.locale"
          v-model:content-html="trans.contentHtml"
          v-model:image-caption="trans.imageCaption"
          v-model:alt="trans.alt"
          role="tabpanel"
          :aria-labelledby="panelLabelledBy(trans.locale)"
          :translation="trans"
          :index="index"
          :content-error="getFieldError(`translations.${index}.contentHtml`)"
        />
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <div class="space-y-5 rounded-xl border p-5">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-settings" class="text-muted size-4" />
            {{ t('admin.areaReports.form.configTitle') }}
          </h3>

          <UFormField
            :label="`${t('admin.areaReports.form.areaLabel')} *`"
            :error="getFieldError('areaId')"
          >
            <USelectMenu
              v-if="!isEditing"
              :model-value="form.areaId ?? undefined"
              :items="areaSelectItems"
              value-key="value"
              class="w-full"
              :placeholder="t('admin.areaReports.form.areaPlaceholder')"
              :disabled="Boolean(areasError)"
              @update:model-value="form.areaId = ($event as number | undefined) ?? null"
            />
            <!-- The area is fixed once the report exists, so on edit it is shown read-only. -->
            <p v-else class="text-sm">{{ snapshotAreaName ?? '—' }}</p>
          </UFormField>

          <UFormField
            :label="`${t('admin.areaReports.form.monthLabel')} *`"
            :error="getFieldError('monthKey')"
          >
            <ClientOnly>
              <AdminMonthPicker
                v-model="monthPickerValue"
                :hint="t('admin.areaReports.form.monthHint')"
                :taken-label="t('admin.areaReports.form.monthTaken')"
              />
              <template #fallback>
                <UInput
                  :model-value="form.monthKey"
                  placeholder="YYYY-MM"
                  class="w-full"
                  @update:model-value="form.monthKey = String($event)"
                />
              </template>
            </ClientOnly>
          </UFormField>

          <UFormField
            :label="t('admin.areaReports.form.coversFromLabel')"
            :error="getFieldError('coversFrom')"
          >
            <div class="mb-2 flex items-center gap-2">
              <USwitch :model-value="hasCoversFrom" @update:model-value="toggleCoversFrom" />
              <span class="text-muted text-sm">{{
                t('admin.areaReports.form.coversFromToggle')
              }}</span>
            </div>
            <ClientOnly v-if="hasCoversFrom">
              <AdminMonthPicker v-model="coversFromPickerValue" hint="" />
              <template #fallback>
                <UInput
                  :model-value="form.coversFrom"
                  placeholder="YYYY-MM"
                  class="w-full"
                  @update:model-value="form.coversFrom = String($event)"
                />
              </template>
            </ClientOnly>
            <p class="text-muted mt-1 text-xs">{{ t('admin.areaReports.form.coversFromHint') }}</p>
          </UFormField>

          <UFormField :label="t('admin.areaReports.form.statusLabel')">
            <div class="flex items-center gap-2">
              <USwitch v-model="form.active" />
              <span class="text-sm">{{
                form.active ? t('admin.common.active') : t('admin.common.inactive')
              }}</span>
            </div>
          </UFormField>
        </div>

        <AdminActivityImagePanel
          :upload="imageUpload"
          :has-image="Boolean(form.image)"
          :image-error="getFieldError('image')"
          @clear="clearImage"
        />
      </aside>
    </div>

    <AdminActivityCancelModal v-model:open="showCancelModal" @confirm="confirmCancel" />
  </form>
</template>
