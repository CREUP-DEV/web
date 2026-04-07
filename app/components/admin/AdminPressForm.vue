<script setup lang="ts">
import { CalendarDate } from '@internationalized/date'
import {
  calendarDateLikeToDateOnly,
  dateValueToDateOnly,
  parseDateOnlyString,
} from '~~/shared/utils/date'

type PressArticleType = 'press_release' | 'statement' | 'media_appearance'

interface Translation {
  locale: string
  title: string
  description: string
  contentHtml: string
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

const props = defineProps<{
  /** The article being edited, or null when creating */
  article?: PressArticle | null
  /** Initial article type for create flows */
  initialType?: PressArticleType
  /** Whether the form is currently submitting */
  submitting?: boolean
}>()

const emit = defineEmits<{
  submit: [payload: Record<string, unknown>]
  cancel: []
}>()

const {
  getDefaultTranslationValue,
  getLocaleFlag,
  getLocaleName,
  isDefaultLocale,
  createEmptyTranslations,
  mapTranslationsToForm,
} = useLocales()

const isEditing = computed(() => !!props.article)

// Unsaved changes detection (must be defined before await)
const hasUnsavedChanges = ref(false)
defineExpose({ hasUnsavedChanges })

// Fetch supporting data
const [{ data: tagsData }, { data: mediaData }] = await Promise.all([
  useFetch<{ items: Tag[] }>('/api/admin/tags'),
  useFetch<{ items: MediaOutlet[] }>('/api/admin/media'),
])

const tags = computed(() => tagsData.value?.items ?? [])
const mediaOutlets = computed(() => mediaData.value?.items ?? [])

// File uploads
const imageUpload = useAdminFileUpload({
  endpoint: '/api/admin/press/upload',
  successMessage: 'Imagen subida correctamente',
  errorMessage: 'No se pudo subir la imagen',
  onUploaded: (storagePath) => {
    form.image = storagePath
  },
  getFallbackPreview: () => form.image || null,
})
const pdfUpload = useAdminDocumentUpload({
  endpoint: '/api/admin/press/upload',
  onUploaded: (storagePath) => {
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
  translations: createEmptyTranslations<Translation>({
    title: '',
    description: '',
    contentHtml: '',
    alt: '',
  }),
})

const typeLabels: Record<PressArticleType, string> = {
  press_release: 'Notas de prensa',
  statement: 'Comunicados',
  media_appearance: 'En los medios',
}

const typeIcons: Record<PressArticleType, string> = {
  press_release: 'i-tabler-writing-sign',
  statement: 'i-tabler-speakerphone',
  media_appearance: 'i-tabler-broadcast',
}

const publicArticleUrl = computed(() => {
  if (!props.article?.slug) return null
  const prefixes: Record<PressArticleType, string> = {
    press_release: '/prensa/notas-prensa',
    statement: '/prensa/comunicados',
    media_appearance: '/prensa/en-los-medios',
  }
  return `${prefixes[props.article.type]}/${props.article.slug}`
})

const submitAttempted = ref(false)
const canSubmit = computed(() => Boolean(form.image))

const handleSubmit = () => {
  submitAttempted.value = true
  if (!canSubmit.value) return
  emit('submit', {
    ...form,
    publishedAt: calendarDateToDateOnly(publishedAt.value),
  })
}

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
const calendarDateToDateOnly = (date: CalendarDate) => calendarDateLikeToDateOnly(date)

const valueToCalendarDate = (value: string): CalendarDate => {
  const normalizedDate = parseDateOnlyString(dateValueToDateOnly(value))

  if (!normalizedDate) {
    return new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate())
  }

  return new CalendarDate(normalizedDate.year, normalizedDate.month, normalizedDate.day)
}

const getTagName = (tag: Tag) => {
  return getDefaultTranslationValue(tag.translations, 'name') ?? tag.slug
}

// Populate form from article when editing
const populateForm = (article: PressArticle) => {
  form.type = article.type
  form.image = article.image
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
  }) as Translation[]
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
    }
  },
  { immediate: true }
)

const handleRemovePdf = () => {
  pdfUpload.remove()
  form.pdfUrl = null
}

watch(
  form,
  () => {
    hasUnsavedChanges.value = true
  },
  { deep: true }
)

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
          Volver
        </UButton>
        <USeparator orientation="vertical" class="h-5 shrink-0" />
        <UIcon :name="typeIcons[form.type]" class="text-muted size-4 shrink-0" />
        <span class="text-muted truncate text-sm">
          {{ isEditing ? 'Editando' : 'Nuevo' }} · {{ typeLabels[form.type] }}
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
          aria-label="Ver artículo en la web"
        />
        <UButton
          type="submit"
          icon="i-tabler-check"
          :loading="submitting"
          :disabled="!canSubmit || submitting"
          :title="!canSubmit ? 'Sube una imagen antes de guardar' : undefined"
        >
          {{ isEditing ? 'Guardar cambios' : 'Crear artículo' }}
        </UButton>
      </div>
    </div>

    <div class="grid gap-8 xl:grid-cols-[1fr_320px]">
      <div class="min-w-0 space-y-6">
        <div v-if="form.type === 'media_appearance'" class="space-y-4 rounded-xl border p-5">
          <div>
            <h3 class="flex items-center gap-2 font-semibold">
              <UIcon name="i-tabler-broadcast" class="text-muted size-5" />
              Aparición en medios
            </h3>
            <p class="text-muted mt-1 text-xs">
              Indica el enlace a la noticia original y el medio que la publicó.
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Enlace a la noticia *">
              <UInput
                :model-value="form.externalUrl ?? undefined"
                placeholder="https://..."
                class="w-full"
                @update:model-value="form.externalUrl = $event || null"
              />
            </UFormField>

            <UFormField label="Medio *">
              <USelectMenu
                :model-value="form.mediaOutletId ?? undefined"
                :items="mediaOutletSelectItems"
                value-key="value"
                class="w-full"
                placeholder="Selecciona un medio..."
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
              Obligatorio
            </UBadge>
            <span v-else class="text-muted text-xs font-normal">(opcional)</span>
          </h3>

          <div class="space-y-4">
            <UFormField :label="isDefaultLocale(trans.locale) ? 'Título *' : 'Título'">
              <UInput
                v-model="trans.title"
                class="w-full"
                :required="isDefaultLocale(trans.locale)"
              />
            </UFormField>

            <UFormField
              :label="isDefaultLocale(trans.locale) ? 'Descripción breve *' : 'Descripción breve'"
            >
              <UTextarea
                v-model="trans.description"
                class="w-full"
                :rows="2"
                placeholder="Breve resumen del artículo para SEO y listados"
              />
            </UFormField>

            <UFormField
              v-if="form.type === 'press_release' || form.type === 'statement'"
              label="Contenido completo"
            >
              <ClientOnly>
                <LazyAdminRichTextEditor v-model="trans.contentHtml" />
                <template #fallback>
                  <UTextarea
                    v-model="trans.contentHtml"
                    class="w-full"
                    :rows="10"
                    placeholder="Escribe aquí el contenido completo de la noticia..."
                  />
                </template>
              </ClientOnly>
              <p class="text-muted mt-2 text-xs">
                {{
                  isDefaultLocale(trans.locale)
                    ? 'Obligatorio si no subes PDF. En otros idiomas puedes dejarlo vacío y se mostrará el contenido en español.'
                    : 'Opcional. Si lo dejas vacío, se mostrará el contenido en español.'
                }}
              </p>
            </UFormField>

            <UFormField label="Texto alternativo de la imagen">
              <UInput
                v-model="trans.alt"
                class="w-full"
                placeholder="Descripción de la imagen de portada"
              />
            </UFormField>
          </div>
        </div>
      </div>

      <aside class="space-y-6 xl:sticky xl:top-20 xl:self-start">
        <div class="space-y-5 rounded-xl border p-5">
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-settings" class="text-muted size-4" />
            Configuración
          </h3>

          <UFormField v-if="!isEditing" label="Tipo de artículo">
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

          <UFormField label="Fecha publicación">
            <UInputDate ref="inputDate" v-model="publishedAt" class="w-full">
              <template #trailing>
                <UPopover :reference="inputDate?.inputsRef[3]?.$el" :popper="{ strategy: 'fixed' }">
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
        </div>

        <div
          class="space-y-4 rounded-xl border p-5"
          :class="submitAttempted && !form.image ? 'border-error/50' : ''"
        >
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-photo" class="text-muted size-4" />
            Imagen de portada
            <span class="text-error font-normal">*</span>
          </h3>

          <div v-if="imageUpload.preview.value" class="overflow-hidden rounded-lg border">
            <img
              :src="imageUpload.preview.value"
              alt="Vista previa de la imagen"
              class="aspect-video w-full object-cover"
            />
          </div>
          <div
            v-else
            class="bg-muted/10 flex aspect-video items-center justify-center rounded-lg border-2 border-dashed"
          >
            <div class="text-muted text-center">
              <UIcon name="i-tabler-photo-plus" class="mx-auto mb-1 size-7 opacity-50" />
              <p class="text-xs">Sin imagen</p>
            </div>
          </div>
          <input
            :ref="imageUpload.inputRef"
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,.svg,.avif"
            class="hidden"
            @change="imageUpload.handleFileSelect"
          />
          <UButton
            type="button"
            variant="outline"
            icon="i-tabler-upload"
            size="sm"
            block
            :loading="imageUpload.isUploading.value"
            @click="imageUpload.triggerFileDialog"
          >
            {{ imageUpload.preview.value ? 'Cambiar imagen' : 'Subir imagen' }}
          </UButton>
          <p v-if="submitAttempted && !form.image" class="text-error text-xs" role="alert">
            La imagen de portada es obligatoria.
          </p>
          <p v-else class="text-muted text-xs">JPG, PNG, WebP, SVG o AVIF</p>
        </div>

        <div
          v-if="form.type === 'press_release' || form.type === 'statement'"
          class="space-y-4 rounded-xl border p-5"
        >
          <h3 class="flex items-center gap-2 text-sm font-semibold">
            <UIcon name="i-tabler-file-type-pdf" class="text-muted size-4" />
            Documento PDF
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
              aria-label="Quitar PDF"
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
            {{ pdfUpload.fileName.value ? 'Cambiar PDF' : 'Subir PDF' }}
          </UButton>
          <p class="text-muted text-xs">
            Opcional. Si no subes PDF, añade el contenido en el editor.
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
            <h2 class="text-base font-bold">Cambios sin guardar</h2>
          </div>
          <p class="text-muted mb-6 text-sm">
            Si sales ahora perderás los cambios realizados. ¿Quieres continuar?
          </p>
          <div class="flex justify-end gap-2">
            <UButton variant="ghost" @click="showCancelModal = false">Seguir editando</UButton>
            <UButton color="warning" @click="confirmCancel">Salir sin guardar</UButton>
          </div>
        </div>
      </template>
    </UModal>
  </form>
</template>
