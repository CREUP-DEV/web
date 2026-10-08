<script setup lang="ts">
import type { PossibleDuplicate } from '~~/shared/utils/possibleDuplicate'
import { ADMIN_ROUTES } from '~~/shared/constants/adminRoutes'

/**
 * Asks whether to go ahead with a create the server flagged as a possible duplicate, naming the
 * existing piece and linking to it (new tab, so the unsaved form survives). State comes from
 * `useAdminPossibleDuplicate`.
 */
const props = defineProps<{
  kind: 'press' | 'activity'
  duplicate: PossibleDuplicate | null
}>()

const emit = defineEmits<{
  confirm: []
}>()

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const localePath = useLocalePath()
const { formatDate } = useLocaleFormatting()

const formatShortDate = (value?: string) =>
  value ? formatDate(value, { year: 'numeric', month: 'short', day: 'numeric' }) : ''

const pressTypeLabel = (type?: PossibleDuplicate['type']) => {
  switch (type) {
    case 'press_release':
      return t('admin.press.duplicate.types.press_release')
    case 'statement':
      return t('admin.press.duplicate.types.statement')
    case 'media_appearance':
      return t('admin.press.duplicate.types.media_appearance')
    default:
      return ''
  }
}

const title = computed(() =>
  props.kind === 'press' ? t('admin.press.duplicate.title') : t('admin.activity.duplicate.title')
)

const description = computed(() => {
  const duplicate = props.duplicate
  if (!duplicate) return ''

  return props.kind === 'press'
    ? t('admin.press.duplicate.description', {
        title: duplicate.title,
        type: pressTypeLabel(duplicate.type),
        date: formatShortDate(duplicate.publishedAt),
      })
    : t('admin.activity.duplicate.description', {
        title: duplicate.title,
        date: formatShortDate(duplicate.startDate),
      })
})

const existingTo = computed(() => {
  const duplicate = props.duplicate
  if (!duplicate) return undefined

  const base = props.kind === 'press' ? ADMIN_ROUTES.press : ADMIN_ROUTES.activity
  return localePath(`${base}/${duplicate.id}`)
})

const openExistingLabel = computed(() =>
  props.kind === 'press'
    ? t('admin.press.duplicate.openExisting')
    : t('admin.activity.duplicate.openExisting')
)

const confirmLabel = computed(() =>
  props.kind === 'press'
    ? t('admin.press.duplicate.confirm')
    : t('admin.activity.duplicate.confirm')
)
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ content: 'sm:max-w-md' }"
  >
    <template #content>
      <div class="p-6">
        <div class="mb-4 flex items-center gap-3">
          <div class="bg-warning/10 flex size-10 shrink-0 items-center justify-center rounded-full">
            <UIcon name="i-tabler-copy" class="text-warning size-6" aria-hidden="true" />
          </div>
          <h2 class="text-base font-bold">{{ title }}</h2>
        </div>
        <p class="text-muted mb-4 text-sm">{{ description }}</p>
        <ULink
          v-if="existingTo"
          :to="existingTo"
          target="_blank"
          class="text-primary mb-6 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {{ openExistingLabel }}
          <UIcon name="i-tabler-external-link" class="size-4" aria-hidden="true" />
        </ULink>
        <div class="flex justify-end gap-2">
          <UButton variant="ghost" @click="open = false">
            {{ t('admin.common.cancel') }}
          </UButton>
          <UButton color="warning" @click="emit('confirm')">
            {{ confirmLabel }}
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
