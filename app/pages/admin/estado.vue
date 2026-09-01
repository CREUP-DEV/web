<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Estado',
})

// The response shape is inferred from the /api/admin/metrics handler so the
// template is type-checked against what the backend actually returns; there is
// no hand-written interface to drift out of sync.
const localeApiHeaders = useLocaleApiHeaders()
const { data, error, pending, refresh } = await useFetch('/api/admin/metrics', {
  headers: localeApiHeaders,
  lazy: true,
})
const { t } = useI18n()
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

const retryingJobId = ref<string | null>(null)
const retryError = ref<string | null>(null)

const retryJob = async (queue: 'newsletter' | 'maintenance', jobId: string) => {
  retryingJobId.value = jobId
  retryError.value = null

  try {
    await $fetch('/api/admin/jobs/retry', {
      method: 'POST',
      body: { jobId, queue },
    })
    await refresh()
  } catch {
    retryError.value = t('admin.stats.retryJobError')
  } finally {
    retryingJobId.value = null
  }
}

const healthMeta = computed(() => {
  const status = stats.value?.health.status ?? 'ok'
  const map = {
    ok: { color: 'success' as const, label: t('admin.stats.healthOk') },
    degraded: { color: 'warning' as const, label: t('admin.stats.healthDegraded') },
    down: { color: 'error' as const, label: t('admin.stats.healthDown') },
  }
  return map[status]
})

const failedJobsTotal = computed(
  () => (stats.value?.queues.newsletter.failed ?? 0) + (stats.value?.queues.maintenance.failed ?? 0)
)

const recentFailuresTotal = computed(
  () =>
    (stats.value?.queues.newsletter.recentFailureCount ?? 0) +
    (stats.value?.queues.maintenance.recentFailureCount ?? 0)
)

const formatMetricDate = (value: string | null) => {
  if (!value) {
    return t('admin.stats.noRecord')
  }

  return formatDateTime(value, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

const formatDuration = (value: number) => `${Math.round(value)} ms`

const formatBytes = (value: number | null) => {
  if (value === null) {
    return '—'
  }

  if (value < 1024) {
    return `${value} B`
  }

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
  if (seconds === null) {
    return '—'
  }

  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)

  if (days > 0) {
    return `${days} d ${hours} h`
  }
  if (hours > 0) {
    return `${hours} h ${minutes} min`
  }
  return `${minutes} min`
}
</script>

<template>
  <div class="space-y-6">
    <section class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold">{{ t('admin.stats.title') }}</h1>
        <p class="text-muted mt-1 text-sm">
          {{ t('admin.stats.subtitle') }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <USwitch v-model="autoRefresh" :label="t('admin.stats.autoLabel')" :disabled="pending" />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
          {{ t('admin.stats.refresh') }}
        </UButton>
      </div>
    </section>

    <template v-if="pending && !stats">
      <div class="grid gap-4 xl:grid-cols-4">
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
      </div>
      <USkeleton class="h-72 rounded-2xl" />
      <USkeleton class="h-72 rounded-2xl" />
    </template>

    <div v-else-if="error && !stats" class="space-y-3">
      <UAlert
        color="error"
        variant="soft"
        :title="t('admin.stats.loadErrorTitle')"
        :description="t('admin.stats.loadErrorDescription')"
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        {{ t('admin.common.retry') }}
      </UButton>
    </div>

    <template v-else-if="stats">
      <UAlert
        v-if="error"
        color="warning"
        variant="soft"
        icon="i-tabler-cloud-off"
        :title="t('admin.stats.staleTitle')"
        :description="t('admin.stats.staleDescription')"
      />

      <UAlert
        :color="healthMeta.color"
        variant="soft"
        :icon="stats.health.status === 'ok' ? 'i-tabler-circle-check' : 'i-tabler-alert-triangle'"
      >
        <template #title>
          <span class="flex items-center gap-2">
            {{ t('admin.stats.systemLabel', { status: healthMeta.label }) }}
            <span class="text-muted text-xs font-normal">
              {{ t('admin.stats.updatedAt', { date: formatMetricDate(stats.generatedAt) }) }}
            </span>
          </span>
        </template>
        <template v-if="stats.health.reasons.length" #description>
          <ul class="list-disc space-y-1 pl-4">
            <li v-for="reason in stats.health.reasons" :key="reason">{{ reason }}</li>
          </ul>
        </template>
      </UAlert>

      <div class="grid gap-4 xl:grid-cols-4">
        <UCard>
          <p class="text-muted text-sm">{{ t('admin.stats.requestsLastMinute') }}</p>
          <p class="mt-3 text-3xl font-semibold">{{ stats.requestRate.lastMinute.total }}</p>
          <p class="text-muted mt-2 text-xs">
            {{
              t('admin.stats.requestsBreakdown', {
                api: stats.requestRate.lastMinute.api,
                admin: stats.requestRate.lastMinute.admin,
                public: stats.requestRate.lastMinute.public,
              })
            }}
          </p>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between gap-2">
            <p class="text-muted text-sm">{{ t('admin.stats.errorsLastMinute') }}</p>
            <UBadge
              :color="stats.requestRate.last5Minutes.serverError > 0 ? 'error' : 'success'"
              variant="subtle"
            >
              5xx
            </UBadge>
          </div>
          <p
            class="mt-3 text-3xl font-semibold"
            :class="stats.requestRate.last5Minutes.serverError > 0 ? 'text-error' : ''"
          >
            {{ stats.requestRate.last5Minutes.serverError }}
          </p>
          <p class="text-muted mt-2 text-xs">
            {{
              t('admin.stats.errorsBreakdown', {
                clientError: stats.requestRate.last5Minutes.clientError,
              })
            }}
          </p>
        </UCard>

        <UCard>
          <p class="text-muted text-sm">{{ t('admin.stats.newsletterBacklog') }}</p>
          <p class="mt-3 text-3xl font-semibold">{{ stats.queues.newsletter.waiting }}</p>
          <p class="text-muted mt-2 text-xs">
            {{
              t('admin.stats.newsletterBacklogBreakdown', {
                active: stats.queues.newsletter.active,
                failed: stats.queues.newsletter.failed,
              })
            }}
          </p>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between gap-2">
            <p class="text-muted text-sm">{{ t('admin.stats.failedJobs') }}</p>
            <UBadge :color="recentFailuresTotal > 0 ? 'warning' : 'neutral'" variant="subtle">
              {{
                recentFailuresTotal > 0
                  ? t('admin.stats.failedRecent')
                  : t('admin.stats.failedStable')
              }}
            </UBadge>
          </div>
          <p class="mt-3 text-3xl font-semibold">{{ failedJobsTotal }}</p>
          <p class="text-muted mt-2 text-xs">
            {{ t('admin.stats.failedJobsBreakdown', { recent: recentFailuresTotal }) }}
          </p>
        </UCard>
      </div>

      <UCard>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">
              {{ t('admin.stats.trafficTitle', { minutes: stats.requestRate.windowMinutes }) }}
            </h2>
            <p class="text-muted mt-1 text-sm">
              {{
                t('admin.stats.trafficSubtitle', {
                  perMinute: stats.requestRate.last5Minutes.totalPerMinute,
                })
              }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold">{{ stats.requestRate.last15Minutes.total }}</p>
            <p class="text-muted text-xs">{{ t('admin.stats.requestsInWindow') }}</p>
          </div>
        </div>

        <div class="mt-4">
          <AdminSparkline :points="stats.requestRate.series" :width="640" :height="64" />
        </div>
      </UCard>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <h2 class="text-lg font-semibold">{{ t('admin.stats.infrastructureTitle') }}</h2>
          <p class="text-muted mt-1 text-sm">{{ t('admin.stats.infrastructureSubtitle') }}</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ t('admin.stats.database') }}</p>
                <UBadge
                  :color="stats.infrastructure.database.status === 'ok' ? 'success' : 'error'"
                  variant="subtle"
                >
                  {{
                    stats.infrastructure.database.status === 'ok'
                      ? t('admin.stats.statusOk')
                      : t('admin.stats.statusError')
                  }}
                </UBadge>
              </div>
              <dl class="text-muted mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.connections') }}</dt>
                  <dd>
                    {{ stats.infrastructure.database.pool.totalCount }}/{{
                      stats.infrastructure.database.pool.maxConnections
                    }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.idle') }}</dt>
                  <dd>{{ stats.infrastructure.database.pool.idleCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.waitingPool') }}</dt>
                  <dd>{{ stats.infrastructure.database.pool.waitingCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.poolErrorsTotal') }}</dt>
                  <dd>{{ stats.infrastructure.database.pool.errorCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.lastError') }}</dt>
                  <dd>{{ formatMetricDate(stats.infrastructure.database.pool.lastErrorAt) }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ t('admin.stats.redis') }}</p>
                <UBadge
                  :color="
                    stats.infrastructure.redis.status === 'ok'
                      ? 'success'
                      : stats.infrastructure.redis.status === 'unconfigured'
                        ? 'warning'
                        : 'error'
                  "
                  variant="subtle"
                >
                  {{ stats.infrastructure.redis.status }}
                </UBadge>
              </div>
              <dl
                v-if="stats.infrastructure.redis.server"
                class="text-muted mt-3 space-y-2 text-sm"
              >
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.connectedClients') }}</dt>
                  <dd>{{ stats.infrastructure.redis.server.connectedClients ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.usedMemory') }}</dt>
                  <dd>{{ stats.infrastructure.redis.server.usedMemoryHuman ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.hitRate') }}</dt>
                  <dd>
                    {{
                      stats.infrastructure.redis.server.hitRate === null
                        ? '—'
                        : `${stats.infrastructure.redis.server.hitRate}%`
                    }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.evictedKeys') }}</dt>
                  <dd>{{ stats.infrastructure.redis.server.evictedKeys ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.uptime') }}</dt>
                  <dd>{{ formatUptime(stats.infrastructure.redis.server.uptimeSeconds) }}</dd>
                </div>
              </dl>
              <p v-else class="text-muted mt-3 text-sm">
                {{
                  stats.infrastructure.redis.status === 'unconfigured'
                    ? t('admin.stats.redisUnconfigured')
                    : t('admin.stats.redisNoServerData')
                }}
              </p>
            </div>

            <div class="rounded-2xl border p-4">
              <p class="font-medium">{{ t('admin.stats.process') }}</p>
              <dl class="text-muted mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.uptime') }}</dt>
                  <dd>{{ formatUptime(stats.process.uptimeSeconds) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.memoryRss') }}</dt>
                  <dd>{{ formatBytes(stats.process.rssBytes) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.heapUsed') }}</dt>
                  <dd>
                    {{ formatBytes(stats.process.heapUsedBytes) }} /
                    {{ formatBytes(stats.process.heapTotalBytes) }}
                  </dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ t('admin.stats.resourceProxy') }}</p>
                <UBadge color="neutral" variant="subtle">
                  {{
                    t('admin.stats.origins', {
                      count: stats.infrastructure.externalAssetProxy.agent.origins,
                    })
                  }}
                </UBadge>
              </div>
              <dl class="text-muted mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.proxyConnected') }}</dt>
                  <dd>{{ stats.infrastructure.externalAssetProxy.agent.connected }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.proxyFree') }}</dt>
                  <dd>{{ stats.infrastructure.externalAssetProxy.agent.free }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.proxyPending') }}</dt>
                  <dd>{{ stats.infrastructure.externalAssetProxy.agent.pending }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.proxyQueued') }}</dt>
                  <dd>{{ stats.infrastructure.externalAssetProxy.agent.queued }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.limitPerOrigin') }}</dt>
                  <dd>
                    {{
                      stats.infrastructure.externalAssetProxy.agent.configuredConnectionsPerOrigin
                    }}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </UCard>

        <UCard>
          <h2 class="text-lg font-semibold">{{ t('admin.stats.queuesTitle') }}</h2>
          <p class="text-muted mt-1 text-sm">
            {{ t('admin.stats.queuesSubtitle') }}
          </p>

          <UAlert
            v-if="retryError"
            class="mt-4"
            color="error"
            variant="soft"
            :description="retryError"
          />

          <div class="mt-5 space-y-4">
            <div
              v-for="queue in [stats.queues.newsletter, stats.queues.maintenance]"
              :key="queue.name"
              class="rounded-2xl border p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium capitalize">{{ queue.name }}</p>
                <UBadge color="neutral" variant="subtle">{{
                  t('admin.stats.pending', { count: queue.waiting + queue.active + queue.delayed })
                }}</UBadge>
              </div>

              <dl class="text-muted mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.waiting') }}</dt>
                  <dd>{{ queue.waiting }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.active') }}</dt>
                  <dd>{{ queue.active }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.delayed') }}</dt>
                  <dd>{{ queue.delayed }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.failed') }}</dt>
                  <dd :class="queue.failed > 0 ? 'text-error font-medium' : ''">
                    {{ queue.failed }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>{{ t('admin.stats.completed') }}</dt>
                  <dd>{{ queue.completed }}</dd>
                </div>
              </dl>

              <div v-if="queue.recentFailures.length" class="mt-4 space-y-2">
                <p class="text-muted text-xs font-medium tracking-wide uppercase">
                  {{ t('admin.stats.retainedFailures') }}
                </p>
                <div
                  v-for="job in queue.recentFailures"
                  :key="job.id"
                  class="rounded-xl border px-3 py-2 text-sm"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="font-medium">
                        {{ job.name }}
                        <span class="text-muted font-normal">{{
                          t('admin.stats.attempts', { count: job.attemptsMade })
                        }}</span>
                      </p>
                      <p class="text-muted mt-1 text-xs break-words">
                        {{ job.failedReason ?? t('admin.stats.noReasonRecorded') }}
                      </p>
                      <p class="text-muted mt-1 text-xs">{{ formatMetricDate(job.failedAt) }}</p>
                    </div>
                    <UButton
                      size="xs"
                      variant="outline"
                      color="neutral"
                      icon="i-tabler-refresh"
                      :loading="retryingJobId === job.id"
                      @click="retryJob(queue.name, job.id)"
                    >
                      {{ t('admin.common.retry') }}
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">{{ t('admin.stats.newsletterWorker') }}</p>
                <UBadge
                  :color="stats.newsletterWorker.activeRunCount > 0 ? 'warning' : 'success'"
                  variant="subtle"
                >
                  {{
                    stats.newsletterWorker.activeRunCount > 0
                      ? t('admin.stats.workerProcessing')
                      : t('admin.stats.workerIdle')
                  }}
                </UBadge>
              </div>
              <p class="text-muted mt-3 text-sm">
                {{
                  stats.newsletterWorker.shutdownRequested
                    ? t('admin.stats.workerShutdownRequested')
                    : t('admin.stats.workerNoShutdown')
                }}
              </p>
              <ul
                v-if="stats.newsletterWorker.activeCampaignIds.length"
                class="mt-3 space-y-2 text-sm"
              >
                <li
                  v-for="campaignId in stats.newsletterWorker.activeCampaignIds"
                  :key="campaignId"
                  class="rounded-xl border px-3 py-2"
                >
                  {{ t('admin.stats.activeNewsletter') }} <code>{{ campaignId }}</code>
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <div>
          <h2 class="text-lg font-semibold">{{ t('admin.stats.slowEndpointsTitle') }}</h2>
          <p class="text-muted mt-1 text-sm">
            {{
              t('admin.stats.slowEndpointsSubtitle', {
                threshold: stats.requestRate.slowRequestThresholdMs,
              })
            }}
          </p>
        </div>

        <div v-if="stats.slowEndpoints.length" class="mt-5 space-y-3">
          <div
            v-for="endpoint in stats.slowEndpoints"
            :key="endpoint.key"
            class="rounded-2xl border p-4"
          >
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="min-w-0">
                <p class="font-medium">{{ endpoint.key }}</p>
                <p class="text-muted mt-1 text-sm">
                  {{
                    t('admin.stats.endpointMeta', {
                      lastSeen: formatMetricDate(endpoint.lastSeenAt),
                      count: endpoint.totalCount,
                    })
                  }}
                </p>
              </div>

              <div class="grid gap-2 text-sm sm:grid-cols-4">
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">{{ t('admin.stats.average') }}</div>
                  <div class="font-medium">{{ formatDuration(endpoint.averageDurationMs) }}</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">{{ t('admin.stats.maximum') }}</div>
                  <div class="font-medium">{{ formatDuration(endpoint.maxDurationMs) }}</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">{{ t('admin.stats.slow') }}</div>
                  <div class="font-medium">{{ endpoint.slowCount }} ({{ endpoint.slowRate }}%)</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">{{ t('admin.stats.serverErrors') }}</div>
                  <div
                    class="font-medium"
                    :class="endpoint.serverErrorCount > 0 ? 'text-error' : ''"
                  >
                    {{ endpoint.serverErrorCount }} ({{ endpoint.serverErrorRate }}%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mt-5 rounded-2xl border px-4 py-10 text-center">
          <p class="text-muted">{{ t('admin.stats.slowEndpointsEmpty') }}</p>
        </div>
      </UCard>
    </template>
  </div>
</template>
