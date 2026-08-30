<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import type { AdminActivityEntry, AdminActivityKind } from '@/composables/admin/useAdminActivity'
import type { AdminMemberOrg } from '@/components/admin/activity/AdminActivityOrganiserPanel.vue'
import { activityEntryClientSchema } from './activityFormSchema'
import { ACTIVITY_PUBLIC_BASE_PATH } from '~~/shared/constants/activity'
import {
  calendarDateLikeToDateOnly,
  dateValueToDateOnly,
  parseDateOnlyString,
} from '~~/shared/utils/date'

const props = defineProps<{
  /** The entry being edited, or null when creating */
  entry?: AdminActivityEntry | null
  /** Initial kind for create flows */
  initialKind?: AdminActivityKind
  /** Whether the form is currently submitting */
  submitting?: boolean
  /** Whether a re-snapshot request is in flight (edit only) */
  refreshingSnapshot?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  refreshSnapshot: []
  cancel: []
}>()

// Form-local translation shape: all fields are strings (UInput/UTextarea need string models).
// API/null values are normalised to '' when populating; '' -> null when building the payload.
interface ActivityFormTranslation {
  locale: string
  title: string
  excerpt: string
  contentHtml: string
  imageCaption: string
  alt: string
}

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const { createEmptyTranslations } = useLocales()
const { clearErrors, getFieldError, validate } = useFormValidation()

const { activeLocale, activeIndex, status, invalidLocales, revealFirstInvalidLocale } =
  useAdminLocaleTabs(
    computed(() => form.translations),
    ['title', 'excerpt', 'contentHtml'],
    getFieldError
  )

const isEditing = computed(() => !!props.entry)

const hasUnsavedChanges = ref(false)
defineExpose({ hasUnsavedChanges })
const isHydratingForm = ref(false)

// Supporting data: member organisations for the organiser dropdown.
const { data: orgsData, error: orgsError } = await useFetch<{ data: AdminMemberOrg[] }>(
  '/api/admin/member-orgs',
  { headers: localeApiHeaders }
)
const organisations = computed(() => orgsData.value?.data ?? [])

const MAX_ACTIVITY_IMAGE_SIZE = 5 * 1024 * 1024

const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/activity/upload',
  successMessage: t('admin.activity.form.imageUploaded'),
  errorMessage: t('admin.activity.form.imageUploadError'),
  maxFileSizeBytes: MAX_ACTIVITY_IMAGE_SIZE,
  maxFileSizeMessage: t('admin.activity.form.imageTooLarge'),
  onUploaded: (storagePath) => {
    clearErrors()
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
})

const today = new Date()
const makeToday = () => new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
const startDate = shallowRef<CalendarDate>(makeToday())
const endDate = shallowRef<CalendarDate | null>(null)

const form = reactive({
  kind: 'creup' as AdminActivityKind,
  image: '',
  isOnline: false,
  location: '',
  /** Composite "source:id" reference (organiser select). */
  organiserKey: null as string | null,
  active: true,
  translations: createEmptyTranslations<ActivityFormTranslation>({
    title: '',
    excerpt: '',
    contentHtml: '',
    imageCaption: '',
    alt: '',
  }),
})

const kindLabels: Record<AdminActivityKind, string> = {
  creup: t('admin.activity.kinds.creup'),
  member: t('admin.activity.kinds.member'),
}
const kindIcons: Record<AdminActivityKind, string> = {
  creup: 'i-tabler-building-bank',
  member: 'i-tabler-building-community',
}

const calendarDateToDateOnly = (date: CalendarDate) => calendarDateLikeToDateOnly(date)
const valueToCalendarDate = (value: string): CalendarDate => {
  const normalized = parseDateOnlyString(dateValueToDateOnly(value))
  if (!normalized) return makeToday()
  return new CalendarDate(normalized.year, normalized.month, normalized.day)
}

const buildFormSnapshot = () =>
  JSON.stringify({
    kind: form.kind,
    image: form.image,
    isOnline: form.isOnline,
    location: form.location,
    organiserKey: form.organiserKey,
    active: form.active,
    startDate: calendarDateToDateOnly(startDate.value),
    endDate: endDate.value ? calendarDateToDateOnly(endDate.value) : null,
    translations: form.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      excerpt: translation.excerpt,
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

const publicEntryUrl = computed(() => {
  if (!props.entry?.slug) return null
  return localePath(`${ACTIVITY_PUBLIC_BASE_PATH}/${props.entry.slug}`)
})

const clearImage = () => {
  form.image = ''
  imageUpload.setPreview(null)
  clearErrors()
}

const splitOrganiserKey = (key: string | null) => {
  if (!key) return { memberOrgSource: null, memberOrgId: null }
  const separator = key.indexOf(':')
  if (separator === -1) return { memberOrgSource: null, memberOrgId: null }
  return {
    memberOrgSource: key.slice(0, separator),
    memberOrgId: key.slice(separator + 1),
  }
}

const buildPayload = () => {
  const { memberOrgSource, memberOrgId } = splitOrganiserKey(form.organiserKey)
  return {
    kind: form.kind,
    image: form.image?.trim() || null,
    startDate: calendarDateToDateOnly(startDate.value),
    endDate: endDate.value ? calendarDateToDateOnly(endDate.value) : null,
    isOnline: form.isOnline,
    location: form.isOnline ? null : form.location.trim() || null,
    memberOrgSource: form.kind === 'member' ? memberOrgSource : null,
    memberOrgId: form.kind === 'member' ? memberOrgId : null,
    active: form.active,
    translations: form.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title.trim(),
      excerpt: translation.excerpt?.trim() || null,
      contentHtml: translation.contentHtml || null,
      imageCaption: translation.imageCaption?.trim() || null,
      alt: translation.alt?.trim() || null,
    })),
  }
}

// Member events depend on the organiser dropdown; block submit if that supporting data failed.
const canSubmit = computed(() => !(orgsError.value && form.kind === 'member'))
const submitDisabledReason = computed(() =>
  canSubmit.value ? '' : t('admin.activity.form.organiserLoadError')
)

const handleSubmit = () => {
  if (!canSubmit.value) return
  if (isEditing.value && !hasUnsavedChanges.value) return

  const payload = buildPayload()
  if (!validate(activityEntryClientSchema, payload)) {
    revealFirstInvalidLocale()
    return
  }

  emit('submit', payload)
}

const populateForm = (entry: AdminActivityEntry) => {
  isHydratingForm.value = true
  clearErrors()
  form.kind = entry.kind
  form.image = entry.image ?? ''
  form.isOnline = entry.isOnline
  form.location = entry.location ?? ''
  form.organiserKey =
    entry.memberOrgSource && entry.memberOrgId
      ? `${entry.memberOrgSource}:${entry.memberOrgId}`
      : null
  form.active = entry.active
  imageUpload.setPreview(entry.image || null)
  startDate.value = valueToCalendarDate(entry.startDate)
  endDate.value = entry.endDate ? valueToCalendarDate(entry.endDate) : null
  form.translations = entry.translations.length
    ? createEmptyTranslations<ActivityFormTranslation>({
        title: '',
        excerpt: '',
        contentHtml: '',
        imageCaption: '',
        alt: '',
      }).map((empty) => {
        const existing = entry.translations.find((item) => item.locale === empty.locale)
        if (!existing) return empty
        return {
          locale: empty.locale,
          title: existing.title ?? '',
          excerpt: existing.excerpt ?? '',
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
  () => props.entry,
  (entry) => {
    if (entry) populateForm(entry)
  },
  { immediate: true }
)

watch(
  () => props.initialKind,
  (initialKind) => {
    if (!isEditing.value && initialKind) {
      form.kind = initialKind
      nextTick(resetUnsavedChangesBaseline)
    }
  },
  { immediate: true }
)

watch(hasFormChanges, (value) => {
  if (isHydratingForm.value) return
  hasUnsavedChanges.value = value
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
      v-if="orgsError && form.kind === 'member'"
      color="error"
      variant="soft"
      :title="t('admin.activity.form.organiserLoadError')"
      :description="t('admin.activity.form.organiserLoadErrorDescription')"
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
          {{ t('admin.activity.form.back') }}
        </UButton>
        <USeparator orientation="vertical" class="h-5 shrink-0" />
        <UIcon :name="kindIcons[form.kind]" class="text-muted size-4 shrink-0" />
        <span class="text-muted truncate text-sm">
          {{
            isEditing ? t('admin.activity.form.editingLabel') : t('admin.activity.form.newLabel')
          }}
          · {{ kindLabels[form.kind] }}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          v-if="isEditing && form.kind === 'member'"
          type="button"
          variant="outline"
          color="neutral"
          icon="i-tabler-refresh"
          size="sm"
          :loading="refreshingSnapshot"
          :title="t('admin.activity.form.refreshSnapshotHint')"
          @click="emit('refreshSnapshot')"
        >
          {{ t('admin.activity.form.refreshSnapshot') }}
        </UButton>
        <UButton
          v-if="publicEntryUrl"
          type="button"
          variant="ghost"
          icon="i-tabler-external-link"
          size="sm"
          :to="publicEntryUrl"
          target="_blank"
          :aria-label="t('admin.activity.form.viewOnWebAria')"
        />
        <UButton
          type="submit"
          icon="i-tabler-check"
          :loading="submitting"
          :disabled="!canSubmit || submitting || (isEditing && !hasUnsavedChanges)"
          :title="submitDisabledReason || undefined"
        >
          {{
            isEditing ? t('admin.activity.form.saveChanges') : t('admin.activity.form.createEntry')
          }}
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div class="min-w-0 space-y-6">
        <AdminLocaleTabs
          v-model="activeLocale"
          :status="status"
          :invalid-locales="invalidLocales"
        />

        <AdminActivityTranslationCard
          v-for="(trans, index) in form.translations"
          v-show="index === activeIndex"
          :key="trans.locale"
          v-model:title="trans.title"
          v-model:excerpt="trans.excerpt"
          v-model:content-html="trans.contentHtml"
          v-model:image-caption="trans.imageCaption"
          v-model:alt="trans.alt"
          :translation="trans"
          :index="index"
          :title-error="getFieldError(`translations.${index}.title`)"
          :excerpt-error="getFieldError(`translations.${index}.excerpt`)"
          :content-error="getFieldError(`translations.${index}.contentHtml`)"
        />
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <AdminActivityConfigPanel
          v-model:kind="form.kind"
          v-model:start-date="startDate"
          v-model:end-date="endDate"
          v-model:is-online="form.isOnline"
          v-model:location="form.location"
          v-model:active="form.active"
          :is-editing="isEditing"
          :kind-labels="kindLabels"
          :kind-icons="kindIcons"
          :start-date-error="getFieldError('startDate')"
          :end-date-error="getFieldError('endDate')"
        />

        <AdminActivityOrganiserPanel
          v-if="form.kind === 'member'"
          v-model:selected-key="form.organiserKey"
          :organisations="organisations"
          :has-error="Boolean(orgsError)"
          :organiser-error="getFieldError('memberOrgId')"
          :frozen-snapshot="entry?.memberOrgSnapshot ?? null"
        />

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
