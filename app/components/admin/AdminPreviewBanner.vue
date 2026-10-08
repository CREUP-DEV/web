<script setup lang="ts">
/**
 * Strip shown above an admin preview, which renders the public detail page inside the public
 * layout: says it is a preview, why the piece is not public (yet), and leads back to the editor.
 */
export type AdminPreviewStatus = 'public' | 'inactive' | 'scheduled'

const props = defineProps<{
  /** `null` while the piece could not be loaded. */
  status: AdminPreviewStatus | null
  /** Publication date (date-only) of a scheduled piece. */
  publishedAt?: string | null
  editorTo: string
  /** Localized public URL, only while the piece is public. */
  publicTo?: string | null
}>()

const { t } = useI18n()
const { formatDate } = useLocaleFormatting()

const statusText = computed(() => {
  switch (props.status) {
    case 'public':
      return t('admin.contentPreview.status.public')
    case 'inactive':
      return t('admin.contentPreview.status.inactive')
    case 'scheduled':
      return t('admin.contentPreview.status.scheduled', {
        date: props.publishedAt
          ? formatDate(props.publishedAt, { year: 'numeric', month: 'long', day: 'numeric' })
          : '',
      })
    default:
      return ''
  }
})
</script>

<template>
  <div
    role="status"
    class="no-print border-b"
    :class="
      status === 'public' ? 'border-success/40 bg-success/10' : 'border-warning/40 bg-warning/10'
    "
  >
    <UContainer class="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 text-sm">
      <UIcon
        :name="status === 'public' ? 'i-tabler-world' : 'i-tabler-eye-off'"
        class="size-5 shrink-0"
        :class="status === 'public' ? 'text-success' : 'text-warning'"
        aria-hidden="true"
      />
      <p class="min-w-0 flex-1">
        <strong>{{ t('admin.contentPreview.label') }}</strong>
        <template v-if="statusText"> · {{ statusText }}</template>
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="publicTo"
          :to="publicTo"
          size="sm"
          color="neutral"
          variant="ghost"
          icon="i-tabler-external-link"
        >
          {{ t('admin.contentPreview.viewPublic') }}
        </UButton>
        <UButton :to="editorTo" size="sm" color="neutral" variant="outline" icon="i-tabler-pencil">
          {{ t('admin.contentPreview.backToEditor') }}
        </UButton>
      </div>
    </UContainer>
  </div>
</template>
