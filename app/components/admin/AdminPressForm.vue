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
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'
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
const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()
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
const inputDate = useTemplateRef<{
  inputsRef: Array<{ $el: HTMLElement | undefined } | undefined>
}>('inputDate')

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
        <div v-if="form.type === 'media_appearance'" class="space-y-4 rounded-xl border p-5">
          <div>
            <h3 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-tabler-broadcast" class="text-muted size-5" />
              {{ t('admin.press.form.mediaAppearanceTitle') }}
            </h3>
            <p class="text-muted mt-1 text-xs">
              {{ t('admin.press.form.mediaAppearanceHint') }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              :label="`${t('admin.press.form.externalUrlLabel')} *`"
              :error="getFieldError('externalUrl')"
            >
              <UInput
                :model-value="form.externalUrl ?? undefined"
                placeholder="https://..."
                class="w-full"
                @update:model-value="form.externalUrl = $event || null"
              />
            </UFormField>

            <UFormField
              :label="`${t('admin.press.form.mediaOutletLabel')} *`"
              :error="getFieldError('mediaOutletId')"
            >
              <USelectMenu
                :model-value="form.mediaOutletId ?? undefined"
                :items="mediaOutletSelectItems"
                value-key="value"
                class="w-full"
                :placeholder="t('admin.press.form.mediaOutletPlaceholder')"
                :disabled="Boolean(supportDataError)"
                @update:model-value="form.mediaOutletId = $event ?? null"
              />
            </UFormField>
          </div>
        </div>
        <div
          v-for="(trans, index) in form.translations"
          :key="trans.locale"
          class="rounded-xl border p-5"
          :class="index === 0 ? 'border-primary/30 bg-primary/5' : ''"
        >
          <h3 class="mb-4 flex items-center gap-2 font-semibold">
            <UIcon :name="getLocaleFlag(trans.locale)" class="size-5" />
            {{ getLocaleName(trans.locale) }}
            <UBadge v-if="isDefaultLocale(trans.locale)" variant="subtle" color="primary" size="sm">
              {{ t('admin.press.form.requiredBadge') }}
            </UBadge>
            <span v-else class="text-muted text-xs font-normal">{{
              t('admin.common.optional')
            }}</span>
          </h3>

          <div class="space-y-4">
            <UFormField
              :label="
                isDefaultLocale(trans.locale)
                  ? `${t('admin.press.form.titleLabel')} *`
                  : t('admin.press.form.titleLabel')
              "
              :error="getFieldError(`translations.${index}.title`)"
            >
              <UInput
                v-model="trans.title"
                class="w-full"
                :required="isDefaultLocale(trans.locale)"
              />
            </UFormField>

            <UFormField
              :label="
                isDefaultLocale(trans.locale)
                  ? `${t('admin.press.form.descriptionLabel')} *`
                  : t('admin.press.form.descriptionLabel')
              "
              :error="getFieldError(`translations.${index}.description`)"
            >
              <UTextarea
                v-model="trans.description"
                class="w-full"
                :rows="2"
                :placeholder="t('admin.press.form.descriptionPlaceholder')"
              />
            </UFormField>

            <UFormField
              v-if="form.type === 'press_release' || form.type === 'statement'"
              :label="t('admin.press.form.contentLabel')"
              :error="getFieldError(`translations.${index}.contentHtml`)"
            >
              <ClientOnly>
                <LazyAdminRichTextEditor v-model="trans.contentHtml" />
                <template #fallback>
                  <UTextarea
                    v-model="trans.contentHtml"
                    class="w-full"
                    :rows="10"
                    :placeholder="t('admin.press.form.contentPlaceholder')"
                  />
                </template>
              </ClientOnly>
              <p class="text-muted mt-2 text-xs">
                {{
                  isDefaultLocale(trans.locale)
                    ? t('admin.press.form.contentHintDefault')
                    : t('admin.press.form.contentHintOther')
                }}
              </p>
            </UFormField>

            <UFormField :label="t('admin.press.form.altLabel')">
              <UInput
                v-model="trans.alt"
                class="w-full"
                :placeholder="t('admin.press.form.altPlaceholder')"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <div class="space-y-5 rounded-xl border p-5">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-settings" class="text-muted size-4" />
            {{ t('admin.press.form.configTitle') }}
          </h3>

          <UFormField v-if="!isEditing" :label="t('admin.press.form.typeLabel')">
            <USelectMenu
              v-model="form.type"
              :items="Object.entries(typeLabels).map(([value, label]) => ({ value, label }))"
              value-key="value"
              class="w-full"
            />
          </UFormField>
          <div v-else class="flex items-center gap-2 text-sm">
            <UIcon :name="typeIcons[form.type]" class="text-muted size-4 shrink-0" />
            <span>{{ typeLabels[form.type] }}</span>
          </div>

          <UFormField :label="t('admin.press.form.publishedAtLabel')">
            <UInputDate ref="inputDate" v-model="publishedAt" class="w-full">
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[3]?.$el" :popper="{ strategy: 'fixed' }">
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    icon="i-tabler-calendar"
                    :aria-label="t('admin.press.form.selectDateAria')"
                    class="px-0"
                  />
                  <template #content>
                    <UCalendar v-model="publishedAt" class="p-2" />
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>

          <UFormField :label="t('admin.press.form.statusLabel')">
            <div class="flex items-center gap-2">
              <USwitch v-model="form.active" />
              <span class="text-sm">{{
                form.active ? t('admin.common.active') : t('admin.common.inactive')
              }}</span>
            </div>
          </UFormField>

          <UFormField :label="t('admin.press.form.tagsLabel')">
            <USelectMenu
              v-model="form.tagIds"
              :items="tagSelectItems"
              value-key="value"
              multiple
              class="w-full"
              :placeholder="t('admin.press.form.tagsPlaceholder')"
              :disabled="Boolean(supportDataError)"
            />
          </UFormField>
        </div>

        <div
          class="space-y-4 rounded-xl border p-5"
          :class="getFieldError('image') ? 'border-error/50' : ''"
        >
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-photo" class="text-muted size-4" />
            {{ t('admin.press.form.coverImageTitle') }}
          </h3>
          <p class="text-muted text-xs">
            {{ t('admin.press.form.coverImageHintBefore') }}
            <NuxtLink
              :to="localePath(ADMIN_ROUTES.siteDefaultImages)"
              class="text-primary underline underline-offset-2"
            >
              {{ t('admin.press.form.coverImageHintLink') }}
            </NuxtLink>
            {{ t('admin.press.form.coverImageHintAfter') }}
          </p>

          <div v-if="imageUpload.preview.value" class="overflow-hidden rounded-lg border">
            <img
              :src="imageUpload.preview.value"
              :alt="t('admin.press.form.imagePreviewAlt')"
              class="aspect-video w-full object-cover"
            />
          </div>
          <div
            v-else
            class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
          >
            <div class="text-muted text-center">
              <UIcon name="i-tabler-photo-plus" class="mx-auto mb-1 size-7 opacity-50" />
              <p class="text-xs">{{ t('admin.press.form.noImage') }}</p>
            </div>
          </div>
          <input
            :ref="imageUpload.inputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
            class="hidden"
            @change="imageUpload.handleFileSelect"
          />
          <div class="flex flex-col gap-2 sm:flex-row">
            <UButton
              type="button"
              variant="outline"
              icon="i-tabler-upload"
              size="sm"
              class="flex-1"
              :loading="imageUpload.isUploading.value"
              @click="imageUpload.triggerFileDialog"
            >
              {{
                imageUpload.preview.value
                  ? t('admin.press.form.changeImage')
                  : t('admin.press.form.uploadImage')
              }}
            </UButton>
            <UButton
              v-if="form.image"
              type="button"
              variant="ghost"
              color="error"
              icon="i-tabler-trash"
              size="sm"
              @click="clearCoverImage"
            >
              {{ t('admin.press.form.removeImage') }}
            </UButton>
          </div>
          <p v-if="getFieldError('image')" class="text-error text-xs" role="alert">
            {{ getFieldError('image') }}
          </p>
          <p v-else class="text-muted text-xs">{{ t('admin.press.form.imageFormats') }}</p>
        </div>

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

    <UModal v-model:open="showCancelModal" :ui="{ content: 'sm:max-w-sm' }">
      <template #content>
        <div class="p-6">
          <div class="mb-4 flex items-center gap-3">
            <div
              class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <UIcon name="i-tabler-alert-triangle" class="text-warning size-6" />
            </div>
            <h2 class="text-base font-bold">{{ t('admin.press.form.cancelModalTitle') }}</h2>
          </div>
          <p class="text-muted mb-6 text-sm">
            {{ t('admin.press.form.cancelModalBody') }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCancelModal = false">{{
              t('admin.press.form.keepEditing')
            }}</UButton>
            <UButton color="warning" @click="confirmCancel">{{
              t('admin.press.form.discardChanges')
            }}</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </form>
</template>
