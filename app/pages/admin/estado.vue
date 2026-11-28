<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import { campaignEditorPath } from '@/composables/admin/useAdminNewsletterCampaigns'

definePageMeta({
  layout: 'admin',
})

/**
 * Operational status for env admins, ordered by how often each part matters: the verdict and why,
 * four live figures, what needs action now (only when something does), the traffic of the last
 * minutes, the services and queues, and the endpoints that were slow or failed since the process
 * started. The response shape is inferred from /api/admin/metrics, so the template is checked
 * against what the backend returns.
 */
const localeApiHeaders = useLocaleApiHeaders()
const { data, error, pending, refresh } = await useFetch('/api/admin/metrics', {
  headers: localeApiHeaders,
  lazy: true,
})
const { t, n } = useI18n()
const localePath = useLocalePath()
const { formatDateTime } = useLocaleFormatting()

const stats = computed(() => data.value?.data ?? null)

const autoRefresh = ref(true)
const { pause, resume } = useIntervalFn(() => refresh(), 15_000)
watch(
  autoRefresh,
  (enabled) => {
    if (enabled) {
      resume()
    } else {
      pause()
    }
  },
  { immediate: true }
)

type QueueName = 'newsletter' | 'maintenance'

const toast = useAdminToast()
const retryingJobId = ref<string | null>(null)

const retryJob = async (queue: QueueName, jobId: string) => {
  retryingJobId.value = jobId

  try {
    await $fetch('/api/admin/jobs/retry', {
      method: 'POST',
      body: { jobId, queue },
    })
    await refresh()
  } catch {
    toast.add({ title: t('admin.stats.retryJobError'), color: 'error' })
  } finally {
    retryingJobId.value = null
  }
}

const formatDate = (value: string | null, withSeconds = false) =>
  value
    ? formatDateTime(value, { dateStyle: 'medium', timeStyle: withSeconds ? 'medium' : 'short' })
    : t('admin.stats.noRecord')

const formatDuration = (value: number | null) => (value === null ? '—' : `${Math.round(value)} ms`)

const formatBytes = (value: number | null) => {
  if (value === null) return '—'
  if (value < 1024) return `${value} B`

  const units = ['KB', 'MB', 'GB']
  let size = value / 1024
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`
}

const formatUptime = (seconds: number | null) => {
  if (seconds === null) return '—'

  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)

  if (days > 0) return `${days} d ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}

const formatNumber = (value: number) => n(value)

// --- Verdict --------------------------------------------------------------------------------

const healthMeta = computed(() => {
  const status = stats.value?.health.status ?? 'ok'
  return {
    ok: {
      color: 'success' as const,
      icon: 'i-tabler-circle-check',
      label: t('admin.stats.healthOk'),
    },
    degraded: {
      color: 'warning' as const,
      icon: 'i-tabler-alert-triangle',
      label: t('admin.stats.healthDegraded'),
    },
    down: {
      color: 'error' as const,
      icon: 'i-tabler-alert-octagon',
      label: t('admin.stats.healthDown'),
    },
  }[status]
})

const healthReasons = computed(() =>
  (stats.value?.health.reasons ?? []).map((reason) =>
    'count' in reason
      ? t(`admin.stats.reasons.${reason.code}`, { count: reason.count }, reason.count)
      : t(`admin.stats.reasons.${reason.code}`)
  )
)

// --- Live figures -----------------------------------------------------------------------------

interface Kpi {
  key: string
  label: string
  value: string
  hint: string
  tone?: 'error' | 'warning'
  icon: string
}

const kpis = computed<Kpi[]>(() => {
  const value = stats.value
  if (!value) return []

  const recent = value.requestRate.last5Minutes
  const threshold = value.requestRate.slowRequestThresholdMs
  const newsletterPending = value.queues.newsletter.waiting + value.queues.newsletter.active
  const sending = value.newsletterWorker.activeCampaigns[0]

  return [
    {
      key: 'traffic',
      icon: 'i-tabler-chart-line',
      label: t('admin.stats.kpi.traffic'),
      value: t('admin.stats.kpi.perMinute', { value: recent.totalPerMinute }),
      hint: t('admin.stats.kpi.trafficBreakdown', {
        public: recent.publicPerMinute,
        api: recent.apiPerMinute,
        admin: recent.adminPerMinute,
      }),
    },
    {
      key: 'latency',
      icon: 'i-tabler-clock-bolt',
      label: t('admin.stats.kpi.latency'),
      value: formatDuration(recent.averageDurationMs),
      tone: recent.slow > 0 ? 'warning' : undefined,
      hint:
        recent.slow > 0
          ? t('admin.stats.kpi.slowRequests', { count: recent.slow, threshold }, recent.slow)
          : t('admin.stats.kpi.noSlowRequests', { threshold }),
    },
    {
      key: 'errors',
      icon: 'i-tabler-server-bolt',
      label: t('admin.stats.kpi.serverErrors'),
      value: formatNumber(recent.serverError),
      tone: recent.serverError > 0 ? 'error' : undefined,
      hint: t('admin.stats.kpi.clientErrors', { count: recent.clientError }, recent.clientError),
    },
    {
      key: 'newsletter',
      icon: 'i-tabler-send',
      label: t('admin.stats.kpi.newsletter'),
      value: sending ? t('admin.stats.workerSending') : t('admin.stats.workerIdle'),
      hint: sending
        ? (sending.subject ?? t('admin.stats.untitledCampaign'))
        : newsletterPending > 0
          ? t('admin.stats.kpi.newsletterQueued', { count: newsletterPending }, newsletterPending)
          : t('admin.stats.kpi.newsletterNone'),
    },
  ]
})

// --- Needs attention ------------------------------------------------------------------------

interface FailedJob {
  queue: QueueName
  id: string
  name: string
  attemptsMade: number
  failedReason: string | null
  failedAt: string | null
}

/** A retained failure older than this is history, listed under the queues instead of here. */
const FAILURE_ATTENTION_WINDOW_MS = 24 * 60 * 60 * 1000

const failedJobs = computed<FailedJob[]>(() => {
  const value = stats.value
  if (!value) return []

  return (['newsletter', 'maintenance'] as const).flatMap((queue) =>
    value.queues[queue].recentFailures.map((job) => ({ ...job, queue }))
  )
})

/** Measured against the server's clock (`generatedAt`), not the browser's. */
const isRecentFailure = (job: FailedJob) => {
  const generatedAt = Date.parse(stats.value?.generatedAt ?? '')
  const failedAt = Date.parse(job.failedAt ?? '')
  return (
    Number.isFinite(generatedAt) &&
    Number.isFinite(failedAt) &&
    generatedAt - failedAt <= FAILURE_ATTENTION_WINDOW_MS
  )
}

const recentFailedJobs = computed(() => failedJobs.value.filter(isRecentFailure))
const olderFailedJobs = computed(() => failedJobs.value.filter((job) => !isRecentFailure(job)))

/** Endpoints whose last 5xx is recent (the server's window), not the cumulative problem list. */
const erroringEndpoints = computed(() => stats.value?.recentServerErrorEndpoints ?? [])

/**
 * Retained failures older than the attention window: the queue's whole failed count minus the
 * recent ones, though only the newest few are fetched to list and retry.
 */
const olderFailedCount = computed(() => {
  const value = stats.value
  if (!value) return 0
  const retained = value.queues.newsletter.failed + value.queues.maintenance.failed
  return Math.max(0, retained - recentFailedJobs.value.length)
})

const needsAttention = computed(
  () =>
    recentFailedJobs.value.length > 0 ||
    erroringEndpoints.value.length > 0 ||
    Boolean(stats.value?.newsletterWorker.shutdownRequested)
)

// --- Services and queues ----------------------------------------------------------------------

type ServiceTone = 'success' | 'warning' | 'error' | 'neutral'

interface Service {
  key: string
  icon: string
  name: string
  tone: ServiceTone
  status: string
  rows: Array<{ label: string; value: string }>
  note?: string
}

const services = computed<Service[]>(() => {
  const value = stats.value
  if (!value) return []

  const { database, redis, externalAssetProxy } = value.infrastructure
  const pool = database.pool
  const proxy = externalAssetProxy.agent

  const redisTone: ServiceTone =
    redis.status === 'ok' ? 'success' : redis.status === 'unconfigured' ? 'warning' : 'error'
  const redisStatus =
    redis.status === 'ok'
      ? t('admin.stats.statusOk')
      : redis.status === 'unconfigured'
        ? t('admin.stats.statusUnconfigured')
        : t('admin.stats.statusError')

  return [
    {
      key: 'database',
      icon: 'i-tabler-database',
      name: t('admin.stats.database'),
      tone: database.status === 'ok' ? 'success' : 'error',
      status: database.status === 'ok' ? t('admin.stats.statusOk') : t('admin.stats.statusError'),
      rows: [
        {
          label: t('admin.stats.connections'),
          value: `${pool.totalCount} / ${pool.maxConnections}`,
        },
        { label: t('admin.stats.idle'), value: String(pool.idleCount) },
        { label: t('admin.stats.waitingPool'), value: String(pool.waitingCount) },
        { label: t('admin.stats.poolErrorsTotal'), value: String(pool.errorCount) },
        { label: t('admin.stats.lastError'), value: formatDate(pool.lastErrorAt) },
      ],
    },
    {
      key: 'redis',
      icon: 'i-tabler-bolt',
      name: t('admin.stats.redis'),
      tone: redisTone,
      status: redisStatus,
      rows: redis.server
        ? [
            {
              label: t('admin.stats.usedMemory'),
              value: redis.server.usedMemoryHuman ?? '—',
            },
            {
              label: t('admin.stats.hitRate'),
              value: redis.server.hitRate === null ? '—' : `${redis.server.hitRate}%`,
            },
            {
              label: t('admin.stats.evictedKeys'),
              value: String(redis.server.evictedKeys ?? '—'),
            },
            {
              label: t('admin.stats.connectedClients'),
              value: String(redis.server.connectedClients ?? '—'),
            },
            { label: t('admin.stats.uptime'), value: formatUptime(redis.server.uptimeSeconds) },
          ]
        : [],
      note: redis.server
        ? undefined
        : redis.status === 'unconfigured'
          ? t('admin.stats.redisUnconfigured')
          : t('admin.stats.redisNoServerData'),
    },
    {
      key: 'process',
      icon: 'i-tabler-brand-nodejs',
      name: t('admin.stats.process'),
      tone: 'neutral',
      status: formatUptime(value.process.uptimeSeconds),
      rows: [
        { label: t('admin.stats.startedAt'), value: formatDate(value.process.startedAt) },
        { label: t('admin.stats.memoryRss'), value: formatBytes(value.process.rssBytes) },
        {
          label: t('admin.stats.heapUsed'),
          value: `${formatBytes(value.process.heapUsedBytes)} / ${formatBytes(value.process.heapTotalBytes)}`,
        },
      ],
    },
    {
      key: 'proxy',
      icon: 'i-tabler-photo-share',
      name: t('admin.stats.resourceProxy'),
      tone: proxy.queued > 0 ? 'warning' : 'neutral',
      status: t('admin.stats.origins', { count: proxy.origins }, proxy.origins),
      rows: [
        { label: t('admin.stats.proxyConnected'), value: String(proxy.connected) },
        { label: t('admin.stats.proxyFree'), value: String(proxy.free) },
        { label: t('admin.stats.proxyPending'), value: String(proxy.pending) },
        { label: t('admin.stats.proxyQueued'), value: String(proxy.queued) },
        {
          label: t('admin.stats.limitPerOrigin'),
          value: String(proxy.configuredConnectionsPerOrigin),
        },
      ],
    },
  ]
})

type QueueState = 'waiting' | 'active' | 'delayed' | 'failed' | 'completed'

/** One row per job state and one column per queue: two columns fit beside the services. */
interface QueueStateRow {
  state: QueueState
  newsletter: number
  maintenance: number
}

const QUEUE_STATES: QueueState[] = ['waiting', 'active', 'delayed', 'failed', 'completed']

const queueRows = computed<QueueStateRow[]>(() => {
  const value = stats.value
  if (!value) return []

  return QUEUE_STATES.map((state) => ({
    state,
    newsletter: value.queues.newsletter[state],
    maintenance: value.queues.maintenance[state],
  }))
})

const queueColumns = computed<TableColumn<QueueStateRow>[]>(() => [
  { accessorKey: 'state', header: t('admin.stats.queueState') },
  {
    accessorKey: 'newsletter',
    header: t('admin.stats.queues.newsletter'),
    meta: { class: { th: 'text-end', td: 'text-end tabular-nums' } },
  },
  {
    accessorKey: 'maintenance',
    header: t('admin.stats.queues.maintenance'),
    meta: { class: { th: 'text-end', td: 'text-end tabular-nums' } },
  },
])

type EndpointRow = NonNullable<typeof stats.value>['slowEndpoints'][number]

const endpointColumns = computed<TableColumn<EndpointRow>[]>(() => [
  { accessorKey: 'key', header: t('admin.stats.endpoint') },
  { accessorKey: 'totalCount', header: t('admin.stats.requests') },
  { accessorKey: 'averageDurationMs', header: t('admin.stats.average') },
  { accessorKey: 'maxDurationMs', header: t('admin.stats.maximum') },
  { accessorKey: 'slowCount', header: t('admin.stats.slow') },
  { accessorKey: 'serverErrorCount', header: t('admin.stats.serverErrors') },
  { accessorKey: 'lastSeenAt', header: t('admin.stats.lastSeen') },
])

const toneText: Record<string, string> = {
  error: 'text-error',
  warning: 'text-warning',
  success: 'text-success',
}
</script>

<template>
  <AdminPage :title="t('admin.stats.title')" :description="t('admin.stats.subtitle')">
    <template #actions>
      <USwitch v-model="autoRefresh" :label="t('admin.stats.autoLabel')" :disabled="pending" />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        <span class="hidden sm:inline">{{ t('admin.stats.refresh') }}</span>
        <span class="sr-only sm:hidden">{{ t('admin.stats.refresh') }}</span>
      </UButton>
    </template>

    <template v-if="pending && !stats">
      <USkeleton class="h-20 rounded-lg" />
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <USkeleton v-for="index in 4" :key="index" class="h-28 rounded-lg" />
      </div>
      <USkeleton class="h-40 rounded-lg" />
      <USkeleton class="h-72 rounded-lg" />
    </template>

    <UAlert
      v-else-if="error && !stats"
      color="error"
      variant="soft"
      :title="t('admin.stats.loadErrorTitle')"
      :description="t('admin.stats.loadErrorDescription')"
      :actions="[
        {
          label: t('admin.common.retry'),
          icon: 'i-tabler-refresh',
          color: 'neutral',
          variant: 'outline',
          onClick: () => refresh(),
        },
      ]"
    />

    <template v-else-if="stats">
      <UAlert
        v-if="error"
        color="warning"
        variant="soft"
        icon="i-tabler-cloud-off"
        :title="t('admin.stats.staleTitle')"
        :description="t('admin.stats.staleDescription')"
      />

      <!-- The verdict, why, and how fresh it is. -->
      <section
        class="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
        :class="{
          'border-success/30 bg-success/5': healthMeta.color === 'success',
          'border-warning/40 bg-warning/5': healthMeta.color === 'warning',
          'border-error/40 bg-error/5': healthMeta.color === 'error',
        }"
        :aria-label="t('admin.stats.systemLabel', { status: healthMeta.label })"
      >
        <div class="flex min-w-0 gap-3">
          <UIcon
            :name="healthMeta.icon"
            class="mt-0.5 size-6 shrink-0"
            :class="toneText[healthMeta.color]"
            aria-hidden="true"
          />
          <div class="min-w-0">
            <p class="text-highlighted font-semibold" role="status">
              {{ t('admin.stats.systemLabel', { status: healthMeta.label }) }}
            </p>
            <ul
              v-if="healthReasons.length"
              class="text-toned mt-1 list-disc space-y-0.5 ps-4 text-sm"
            >
              <li v-for="reason in healthReasons" :key="reason">{{ reason }}</li>
            </ul>
            <p v-else class="text-muted mt-0.5 text-sm">{{ t('admin.stats.allClear') }}</p>
          </div>
        </div>
        <dl class="text-muted shrink-0 space-y-0.5 text-sm sm:text-end">
          <div>
            <dt class="sr-only">{{ t('admin.stats.updatedLabel') }}</dt>
            <dd>{{ t('admin.stats.updatedAt', { date: formatDate(stats.generatedAt, true) }) }}</dd>
          </div>
          <div>
            <dt class="sr-only">{{ t('admin.stats.startedAt') }}</dt>
            <dd>
              {{
                t('admin.stats.runningSince', {
                  date: formatDate(stats.process.startedAt),
                  duration: formatUptime(stats.process.uptimeSeconds),
                })
              }}
            </dd>
          </div>
        </dl>
      </section>

      <!-- Four live figures, all over the last five minutes. -->
      <section :aria-label="t('admin.stats.kpi.label')" class="space-y-2">
        <p class="text-muted text-xs font-medium tracking-wide uppercase">
          {{ t('admin.stats.kpi.label') }}
        </p>
        <div class="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          <UCard v-for="kpi in kpis" :key="kpi.key" :ui="{ body: 'p-3 sm:p-4' }">
            <div class="text-muted flex items-center gap-2 text-sm">
              <UIcon :name="kpi.icon" class="size-4 shrink-0" aria-hidden="true" />
              {{ kpi.label }}
            </div>
            <p
              class="mt-2 truncate text-xl font-semibold sm:text-2xl"
              :class="kpi.tone ? toneText[kpi.tone] : 'text-highlighted'"
            >
              {{ kpi.value }}
            </p>
            <p class="text-muted mt-1 line-clamp-2 text-xs" :title="kpi.hint">{{ kpi.hint }}</p>
          </UCard>
        </div>
      </section>

      <!-- Only what someone has to act on. -->
      <UCard v-if="needsAttention" :ui="{ root: 'ring-warning/40', body: 'p-4 sm:p-5' }">
        <h2 class="text-highlighted flex items-center gap-2 text-base font-semibold">
          <UIcon name="i-tabler-alert-triangle" class="text-warning size-5" aria-hidden="true" />
          {{ t('admin.stats.attentionTitle') }}
        </h2>

        <ul class="divide-default mt-3 divide-y">
          <li v-for="job in recentFailedJobs" :key="`${job.queue}-${job.id}`">
            <AdminStatsFailedJob
              :job="job"
              :retrying="retryingJobId === job.id"
              @retry="retryJob(job.queue, job.id)"
            />
          </li>
          <li v-for="endpoint in erroringEndpoints" :key="endpoint.key" class="py-3 text-sm">
            <p class="text-highlighted font-medium">
              {{
                t(
                  'admin.stats.endpointErrors',
                  { count: endpoint.serverErrorCount, endpoint: endpoint.key },
                  endpoint.serverErrorCount
                )
              }}
            </p>
            <p class="text-muted mt-0.5 text-xs">
              {{
                t('admin.stats.lastServerErrorAt', { date: formatDate(endpoint.lastServerErrorAt) })
              }}
            </p>
          </li>
          <li v-if="stats.newsletterWorker.shutdownRequested" class="py-3 text-sm">
            {{ t('admin.stats.workerShutdownRequested') }}
          </li>
        </ul>
      </UCard>

      <UCard :ui="{ body: 'p-4 sm:p-5' }">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-highlighted text-base font-semibold">
              {{ t('admin.stats.trafficTitle', { minutes: stats.requestRate.windowMinutes }) }}
            </h2>
            <p class="text-muted mt-0.5 text-sm">{{ t('admin.stats.trafficSubtitle') }}</p>
          </div>
          <div class="text-end">
            <p class="text-highlighted text-2xl font-semibold">
              {{ formatNumber(stats.requestRate.last15Minutes.total) }}
            </p>
            <p class="text-muted text-xs">{{ t('admin.stats.requestsInWindow') }}</p>
          </div>
        </div>
        <div class="mt-4">
          <AdminSparkline :points="stats.requestRate.series" :width="640" :height="64" />
        </div>
      </UCard>

      <div class="grid gap-4 xl:grid-cols-5">
        <section :aria-labelledby="'admin-stats-services'" class="space-y-3 xl:col-span-3">
          <h2 id="admin-stats-services" class="text-highlighted text-base font-semibold">
            {{ t('admin.stats.servicesTitle') }}
          </h2>
          <div class="grid gap-4 sm:grid-cols-2">
            <UCard v-for="service in services" :key="service.key" :ui="{ body: 'p-4 sm:p-4' }">
              <div class="flex items-center justify-between gap-3">
                <p class="text-highlighted flex min-w-0 items-center gap-2 font-medium">
                  <UIcon
                    :name="service.icon"
                    class="text-muted size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span class="truncate">{{ service.name }}</span>
                </p>
                <UBadge :color="service.tone" variant="subtle" class="shrink-0">
                  {{ service.status }}
                </UBadge>
              </div>
              <dl v-if="service.rows.length" class="mt-3 space-y-1.5 text-sm">
                <div
                  v-for="row in service.rows"
                  :key="row.label"
                  class="flex items-baseline justify-between gap-4"
                >
                  <dt class="text-muted">{{ row.label }}</dt>
                  <dd class="text-default text-end tabular-nums">{{ row.value }}</dd>
                </div>
              </dl>
              <p v-if="service.note" class="text-muted mt-3 text-sm">{{ service.note }}</p>
            </UCard>
          </div>
        </section>

        <section :aria-labelledby="'admin-stats-queues'" class="space-y-3 xl:col-span-2">
          <h2 id="admin-stats-queues" class="text-highlighted text-base font-semibold">
            {{ t('admin.stats.queuesTitle') }}
          </h2>
          <UCard :ui="{ body: 'p-0 sm:p-0' }">
            <UTable :data="queueRows" :columns="queueColumns" class="text-sm">
              <template #state-cell="{ row }">
                <span class="text-muted">{{ t(`admin.stats.${row.original.state}`) }}</span>
              </template>
              <template #newsletter-cell="{ row }">
                <span
                  :class="
                    row.original.state === 'failed' && row.original.newsletter > 0
                      ? 'text-error font-medium'
                      : 'text-default'
                  "
                >
                  {{ row.original.newsletter }}
                </span>
              </template>
              <template #maintenance-cell="{ row }">
                <span
                  :class="
                    row.original.state === 'failed' && row.original.maintenance > 0
                      ? 'text-error font-medium'
                      : 'text-default'
                  "
                >
                  {{ row.original.maintenance }}
                </span>
              </template>
            </UTable>
            <div class="border-default border-t p-4 text-sm">
              <div class="flex items-center justify-between gap-3">
                <p class="text-highlighted font-medium">{{ t('admin.stats.newsletterWorker') }}</p>
                <UBadge
                  :color="stats.newsletterWorker.activeRunCount > 0 ? 'warning' : 'success'"
                  variant="subtle"
                >
                  {{
                    stats.newsletterWorker.activeRunCount > 0
                      ? t('admin.stats.workerSending')
                      : t('admin.stats.workerIdle')
                  }}
                </UBadge>
              </div>
              <ul v-if="stats.newsletterWorker.activeCampaigns.length" class="mt-2 space-y-1">
                <li v-for="campaign in stats.newsletterWorker.activeCampaigns" :key="campaign.id">
                  <ULink
                    :to="localePath(campaignEditorPath(campaign.id))"
                    class="text-primary hover:underline"
                  >
                    {{ campaign.subject ?? t('admin.stats.untitledCampaign') }}
                  </ULink>
                </li>
              </ul>
              <p v-else class="text-muted mt-1">{{ t('admin.stats.kpi.newsletterNone') }}</p>
            </div>
            <details v-if="olderFailedCount > 0" class="border-default group border-t">
              <summary
                class="text-muted hover:text-default flex cursor-pointer list-none items-center gap-2 p-4 text-sm"
              >
                <UIcon
                  name="i-tabler-chevron-right"
                  class="size-4 shrink-0 transition-transform group-open:rotate-90"
                  aria-hidden="true"
                />
                {{ t('admin.stats.olderFailures', { count: olderFailedCount }, olderFailedCount) }}
              </summary>
              <p v-if="olderFailedJobs.length < olderFailedCount" class="text-muted px-4 text-xs">
                {{ t('admin.stats.olderFailuresShown', { shown: olderFailedJobs.length }) }}
              </p>
              <ul class="divide-default divide-y px-4 pb-1">
                <li v-for="job in olderFailedJobs" :key="`${job.queue}-${job.id}`">
                  <AdminStatsFailedJob
                    :job="job"
                    :retrying="retryingJobId === job.id"
                    @retry="retryJob(job.queue, job.id)"
                  />
                </li>
              </ul>
            </details>
          </UCard>
        </section>
      </div>

      <section :aria-labelledby="'admin-stats-endpoints'" class="space-y-3">
        <div>
          <h2 id="admin-stats-endpoints" class="text-highlighted text-base font-semibold">
            {{ t('admin.stats.slowEndpointsTitle') }}
          </h2>
          <p class="text-muted mt-0.5 text-sm">
            {{
              t('admin.stats.slowEndpointsSubtitle', {
                since: formatDate(stats.process.startedAt),
                threshold: stats.requestRate.slowRequestThresholdMs,
              })
            }}
          </p>
        </div>

        <UCard v-if="stats.slowEndpoints.length" :ui="{ body: 'p-0 sm:p-0' }">
          <UTable :data="stats.slowEndpoints" :columns="endpointColumns" class="text-sm">
            <template #key-cell="{ row }">
              <code class="text-highlighted text-xs break-all whitespace-normal">
                {{ row.original.key }}
              </code>
            </template>
            <template #averageDurationMs-cell="{ row }">
              {{ formatDuration(row.original.averageDurationMs) }}
            </template>
            <template #maxDurationMs-cell="{ row }">
              {{ formatDuration(row.original.maxDurationMs) }}
            </template>
            <template #slowCount-cell="{ row }">
              {{ row.original.slowCount }}
              <span class="text-muted">({{ row.original.slowRate }}%)</span>
            </template>
            <template #serverErrorCount-cell="{ row }">
              <span :class="row.original.serverErrorCount > 0 ? 'text-error font-medium' : ''">
                {{ row.original.serverErrorCount }}
              </span>
              <span class="text-muted">({{ row.original.serverErrorRate }}%)</span>
            </template>
            <template #lastSeenAt-cell="{ row }">
              <span class="text-muted whitespace-nowrap">{{
                formatDate(row.original.lastSeenAt)
              }}</span>
            </template>
          </UTable>
        </UCard>

        <UEmpty
          v-else
          variant="outline"
          icon="i-tabler-gauge"
          :description="t('admin.stats.slowEndpointsEmpty')"
        />
      </section>
    </template>
  </AdminPage>
</template>
