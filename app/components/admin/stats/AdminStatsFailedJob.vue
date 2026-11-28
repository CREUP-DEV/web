<script setup lang="ts">
/** One failed background job on the status page: what failed, why, when, and a retry button. */
defineProps<{
  job: {
    queue: 'newsletter' | 'maintenance'
    id: string
    name: string
    attemptsMade: number
    failedReason: string | null
    failedAt: string | null
  }
  retrying: boolean
}>()

const emit = defineEmits<{ retry: [] }>()

const { t } = useI18n()
const { formatDateTime } = useLocaleFormatting()
</script>

<template>
  <div class="flex items-start justify-between gap-3 py-3">
    <div class="min-w-0 text-sm">
      <p class="text-highlighted font-medium">
        {{
          t('admin.stats.failedJob', {
            name: job.name,
            queue: t(`admin.stats.queues.${job.queue}`),
          })
        }}
        <span class="text-muted font-normal">
          {{ t('admin.stats.attempts', { count: job.attemptsMade }, job.attemptsMade) }}
        </span>
      </p>
      <p
        class="text-muted mt-0.5 line-clamp-2 text-xs break-words"
        :title="job.failedReason ?? undefined"
      >
        {{ job.failedReason ?? t('admin.stats.noReasonRecorded') }}
      </p>
      <p class="text-muted mt-0.5 text-xs">
        {{
          job.failedAt
            ? formatDateTime(job.failedAt, { dateStyle: 'medium', timeStyle: 'short' })
            : t('admin.stats.noRecord')
        }}
      </p>
    </div>
    <UButton
      size="xs"
      variant="outline"
      color="neutral"
      icon="i-tabler-refresh"
      class="shrink-0"
      :loading="retrying"
      @click="emit('retry')"
    >
      {{ t('admin.common.retry') }}
    </UButton>
  </div>
</template>
