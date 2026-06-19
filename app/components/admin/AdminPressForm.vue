<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import type {
  PressArticleAdmin,
  PressMediaOutletAdmin,
  PressTagAdmin,
  PressTranslationAdmin,
} from '@/types/adminPress'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { getApiErrorMessage } from '~~/shared/utils/apiError'
import { pressArticleClientSchema } from './pressArticleFormSchema'
import { getPressArticlePublicListPath } from '~~/shared/constants/pressRoutes'
import {
  calendarDateLikeToDateOnly,
  dateValueToDateOnly,
  parseDateOnlyString,
} from '~~/shared/utils/date'

const props = defineProps<{
  /** The article being edited, or null when creating */
  article?: PressArticleAdmin | null
  /** Initial article type for create flows */
  initialType?: PressArticleType
  /** Whether the form is currently submitting */
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  cancel: []
}>()

const { t } = useI18n()
const localeApiHeaders = useLocaleApiHeaders()
const localePath = useLocalePath()
const { getDefaultTranslationValue, createEmptyTranslations, mapTranslationsToForm } = useLocales()
const { clearErrors, getFieldError, validate } = useFormValidation()

const isEditing = computed(() => !!props.article)

const hasUnsavedChanges = ref(false)
defineExpose({ hasUnsavedChanges })
const isHydratingForm = ref(false)

// Fetch supporting data
const [{ data: tagsData, error: tagsError }, { data: mediaData, error: mediaError }] =
  await Promise.all([
    useFetch<{ data: PressTagAdmin[] }>('/api/admin/tags', { headers: localeApiHeaders }),
    useFetch<{ data: PressMediaOutletAdmin[] }>('/api/admin/media', {
      headers: localeApiHeaders,
    }),
  ])

const tags = computed(() => tagsData.value?.data ?? [])
const mediaOutlets = computed(() => mediaData.value?.data ?? [])
const supportDataError = computed(() => tagsError.value ?? mediaError.value ?? null)
const supportDataErrorTitle = computed(() => {
  if (tagsError.value && mediaError.value) {
    return t('admin.press.form.supportLoadErrorBoth')
  }

  if (tagsError.value) {
    return t('admin.press.form.supportLoadErrorTags')
  }

  if (mediaError.value) {
    return t('admin.press.form.supportLoadErrorMedia')
  }

  return ''
})
const submitDisabledReason = computed(() => {
  if (supportDataError.value) {
    return supportDataErrorTitle.value
  }

  if (isEditing.value && !hasUnsavedChanges.value) {
    return t('admin.press.form.noPendingChanges')
  }

  const imageFieldError = getFieldError('image')
  if (imageFieldError) {
    return imageFieldError
  }

  return ''
})

const MAX_PRESS_IMAGE_SIZE = 5 * 1024 * 1024
const MAX_PRESS_PDF_SIZE = 20 * 1024 * 1024

// File uploads
const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: t('admin.press.form.imageUploaded'),
  errorMessage: t('admin.press.form.imageUploadError'),
  maxFileSizeBytes: MAX_PRESS_IMAGE_SIZE,
  maxFileSizeMessage: t('admin.press.form.imageTooLarge'),
  onUploaded: (storagePath) => {
    clearErrors()
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
})
const pdfUpload = useAdminDocumentUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: t('admin.press.form.pdfUploaded'),
  errorMessage: t('admin.press.form.pdfUploadError'),
  maxFileSizeBytes: MAX_PRESS_PDF_SIZE,
  maxFileSizeMessage: t('admin.press.form.pdfTooLarge'),
  onUploaded: (storagePath) => {
    clearErrors()
    form.pdfUrl = storagePath
  },
})

// Date picker
const today = new Date()
const publishedAt = shallowRef(
  new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
)

// Form state
const form = reactive({
  type: 'press_release' as PressArticleType,
  image: '',
  pdfUrl: '' as string | null,
  externalUrl: '' as string | null,
  mediaOutletId: '' as string | null,
  active: true,
  tagIds: [] as string[],
  translations: createEmptyTranslations<PressTranslationAdmin>({
    title: '',
    description: '',
    contentHtml: '',
    alt: '',
  }),
})

const buildFormSnapshot = () =>
  JSON.stringify({
    type: form.type,
    image: form.image,
    pdfUrl: form.pdfUrl,
    externalUrl: form.externalUrl,
    mediaOutletId: form.mediaOutletId,
    active: form.active,
    tagIds: [...form.tagIds].sort(),
    publishedAt: calendarDateToDateOnly(publishedAt.value),
    translations: form.translations.map((translation) => ({
      locale: translation.locale,
      title: translation.title,
      description: translation.description,
      contentHtml: translation.contentHtml,
      alt: translation.alt,
    })),
  })

const { hasFormChanges, resetFormSnapshot } = useFormSnapshot(buildFormSnapshot)

const resetUnsavedChangesBaseline = () => {
  resetFormSnapshot()
  hasUnsavedChanges.value = false
}

const typeLabels: Record<PressArticleType, string> = {
  press_release: t('admin.press.types.pressRelease'),
  statement: t('admin.press.types.statement'),
  media_appearance: t('admin.press.types.mediaAppearance'),
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-writing-sign',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

const publicArticleUrl = computed(() => {
  if (!props.article?.slug) return null
  return localePath(`${getPressArticlePublicListPath(props.article.type)}/${props.article.slug}`)
})

const canSubmit = computed(() => !supportDataError.value)

const clearCoverImage = () => {
  form.image = ''
  imageUpload.setPreview(null)
  clearErrors()
}

const handleSubmit = () => {
  if (!canSubmit.value) return

  if (isEditing.value && !hasUnsavedChanges.value) {
    return
  }

  const payload = {
    ...form,
    image: form.image?.trim() || null,
    pdfUrl: form.pdfUrl?.trim() || null,
    externalUrl: form.externalUrl?.trim() || null,
    mediaOutletId: form.mediaOutletId?.trim() || null,
    publishedAt: calendarDateToDateOnly(publishedAt.value),
  }

  if (!validate(pressArticleClientSchema, payload)) {
    return
  }

  emit('submit', payload)
}

// Tag select items (exclude the 'all' meta-tag)
const tagSelectItems = computed(() =>
  tags.value
    .filter((t: PressTagAdmin) => t.slug !== 'all')
    .map((t: PressTagAdmin) => ({
      value: t.id,
      label: getTagName(t),
    }))
)

// Media outlet select items
const mediaOutletSelectItems = computed(() =>
  mediaOutlets.value.map((m: PressMediaOutletAdmin) => ({
    value: m.id,
    label: m.name,
  }))
)

// Helpers
const calendarDateToDateOnly = (date: CalendarDate) => calendarDateLikeToDateOnly(date)

const valueToCalendarDate = (value: string): CalendarDate => {
  const normalizedDate = parseDateOnlyString(dateValueToDateOnly(value))

  if (!normalizedDate) {
    return new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  }

  return new CalendarDate(normalizedDate.year, normalizedDate.month, normalizedDate.day)
}

const getTagName = (tag: PressTagAdmin) => {
  return getDefaultTranslationValue(tag.translations, 'name') ?? tag.slug
}

// Populate form from article when editing
const populateForm = (article: PressArticleAdmin) => {
  isHydratingForm.value = true
  clearErrors()
  form.type = article.type
  form.image = article.image ?? ''
  form.pdfUrl = article.pdfUrl
  form.externalUrl = article.externalUrl
  form.mediaOutletId = article.mediaOutletId
  form.active = article.active
  form.tagIds = article.tags.map((t) => t.tagId)
  imageUpload.setPreview(article.image || null)
  pdfUpload.setFile(article.pdfUrl)
  publishedAt.value = valueToCalendarDate(article.publishedAt)
  form.translations = mapTranslationsToForm(article.translations, {
    title: '',
    description: '',
    contentHtml: '',
    alt: '',
  }) as PressTranslationAdmin[]
  nextTick(() => {
    resetUnsavedChangesBaseline()
    isHydratingForm.value = false
  })
}

// Watch for article changes (when data loads)
watch(
  () => props.article,
  (article) => {
    if (article) populateForm(article)
  },
  { immediate: true }
)

watch(
  () => props.initialType,
  (initialType) => {
    if (!isEditing.value && initialType) {
      form.type = initialType
      nextTick(resetUnsavedChangesBaseline)
    }
  },
  { immediate: true }
)

const handleRemovePdf = () => {
  clearErrors()
  pdfUpload.remove()
  form.pdfUrl = null
}

watch(hasFormChanges, (value) => {
  if (isHydratingForm.value) return
  hasUnsavedChanges.value = value
})

const handleCancel = () => {
  if (hasUnsavedChanges.value) {
    showCancelModal.value = true
  } else {
    emit('cancel')
  }
}

const showCancelModal = ref(false)
const confirmCancel = () => {
  showCancelModal.value = false
  emit('cancel')
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <UAlert
      v-if="supportDataError"
      color="error"
      variant="soft"
      :title="supportDataErrorTitle"
      :description="
        getApiErrorMessage(supportDataError, t('admin.press.form.supportLoadErrorDescription'))
      "
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
          {{ t('admin.press.form.back') }}
        </UButton>
        <USeparator orientation="vertical" class="h-5 shrink-0" />
        <UIcon :name="typeIcons[form.type]" class="text-muted size-4 shrink-0" />
        <span class="text-muted truncate text-sm">
          {{ isEditing ? t('admin.press.form.editingLabel') : t('admin.press.form.newLabel') }} ·
          {{ typeLabels[form.type] }}
        </span>
      </div>
      <div class="flex shrink-0 items-center gap-2">
        <UButton
          v-if="publicArticleUrl"
          type="button"
          variant="ghost"
          icon="i-tabler-external-link"
          size="sm"
          :to="publicArticleUrl"
          target="_blank"
          :aria-label="t('admin.press.viewOnWebAria')"
        />
        <UButton
          type="submit"
          icon="i-tabler-check"
          :loading="submitting"
          :disabled="!canSubmit || submitting || (isEditing && !hasUnsavedChanges)"
          :title="submitDisabledReason || undefined"
        >
          {{ isEditing ? t('admin.press.form.saveChanges') : t('admin.press.form.createArticle') }}
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div class="min-w-0 space-y-6">
        <AdminPressMediaAppearanceFields
          v-if="form.type === 'media_appearance'"
          v-model:external-url="form.externalUrl"
          v-model:media-outlet-id="form.mediaOutletId"
          :media-outlet-items="mediaOutletSelectItems"
          :has-support-error="Boolean(supportDataError)"
          :external-url-error="getFieldError('externalUrl')"
          :media-outlet-error="getFieldError('mediaOutletId')"
        />
        <AdminPressTranslationCard
          v-for="(trans, index) in form.translations"
          :key="trans.locale"
          v-model:title="trans.title"
          v-model:description="trans.description"
          v-model:content-html="trans.contentHtml"
          v-model:alt="trans.alt"
          :translation="trans"
          :index="index"
          :type="form.type"
          :title-error="getFieldError(`translations.${index}.title`)"
          :description-error="getFieldError(`translations.${index}.description`)"
          :content-error="getFieldError(`translations.${index}.contentHtml`)"
        />
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <AdminPressConfigPanel
          v-model:type="form.type"
          v-model:published-at="publishedAt"
          v-model:active="form.active"
          v-model:tag-ids="form.tagIds"
          :is-editing="isEditing"
          :type-labels="typeLabels"
          :type-icons="typeIcons"
          :tag-items="tagSelectItems"
          :has-support-error="Boolean(supportDataError)"
        />

        <AdminPressCoverImagePanel
          :upload="imageUpload"
          :has-image="Boolean(form.image)"
          :image-error="getFieldError('image')"
          @clear="clearCoverImage"
        />

        <div
          v-if="form.type === 'press_release' || form.type === 'statement'"
          class="space-y-4 rounded-xl border p-5"
        >
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-file-type-pdf" class="text-muted size-4" />
            {{ t('admin.press.form.pdfTitle') }}
          </h3>

          <div
            v-if="pdfUpload.fileName.value"
            class="bg-muted/30 flex items-center gap-2 rounded-lg border p-3"
          >
            <UIcon name="i-tabler-file-type-pdf" class="text-error size-5 shrink-0" />
            <span class="flex-1 truncate text-sm">{{ pdfUpload.fileName.value }}</span>
            <UButton
              type="button"
              variant="ghost"
              color="error"
              icon="i-tabler-x"
              size="xs"
              :aria-label="t('admin.press.form.removePdfAria')"
              @click="handleRemovePdf"
            />
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
            {{
              pdfUpload.fileName.value
                ? t('admin.press.form.changePdf')
                : t('admin.press.form.uploadPdf')
            }}
          </UButton>
          <p class="text-muted text-xs">
            {{ t('admin.press.form.pdfHint') }}
          </p>
        </div>
      </aside>
    </div>

    <AdminPressCancelModal v-model:open="showCancelModal" @confirm="confirmCancel" />
  </form>
</template>
