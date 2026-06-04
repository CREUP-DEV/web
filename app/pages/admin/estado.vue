<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Estado',
})

// The response shape is inferred from the /api/admin/metrics handler so the
// template is type-checked against what the backend actually returns; there is
// no hand-written interface to drift out of sync.
const { data, error, pending, refresh } = await useFetch('/api/admin/metrics', {
  lazy: true,
})
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
    retryError.value = 'No se pudo reintentar el trabajo. Puede que ya no exista.'
  } finally {
    retryingJobId.value = null
  }
}

const healthMeta = computed(() => {
  const status = stats.value?.health.status ?? 'ok'
  const map = {
    ok: { color: 'success' as const, label: 'Operativo' },
    degraded: { color: 'warning' as const, label: 'Degradado' },
    down: { color: 'error' as const, label: 'Caído' },
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
    return 'Sin registro'
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
        <h1 class="text-2xl font-bold">Estado y métricas</h1>
        <p class="text-muted mt-1 text-sm">
          Uso reciente, colas y señales básicas de salud para administración técnica.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <USwitch v-model="autoRefresh" label="Auto" :disabled="pending" />
        <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
          Actualizar
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
        title="No se pudieron cargar las métricas"
        description="Solo está disponible para administradores definidos en el entorno."
      />
      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Reintentar
      </UButton>
    </div>

    <template v-else-if="stats">
      <UAlert
        v-if="error"
        color="warning"
        variant="soft"
        icon="i-tabler-cloud-off"
        title="Mostrando datos anteriores"
        description="La última actualización falló; estas métricas pueden estar desactualizadas."
      />

      <UAlert
        :color="healthMeta.color"
        variant="soft"
        :icon="stats.health.status === 'ok' ? 'i-tabler-circle-check' : 'i-tabler-alert-triangle'"
      >
        <template #title>
          <span class="flex items-center gap-2">
            Sistema: {{ healthMeta.label }}
            <span class="text-muted text-xs font-normal">
              · Actualizado {{ formatMetricDate(stats.generatedAt) }}
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
          <p class="text-muted text-sm">Peticiones último minuto</p>
          <p class="mt-3 text-3xl font-semibold">{{ stats.requestRate.lastMinute.total }}</p>
          <p class="text-muted mt-2 text-xs">
            API {{ stats.requestRate.lastMinute.api }} · Admin
            {{ stats.requestRate.lastMinute.admin }} · Pública
            {{ stats.requestRate.lastMinute.public }}
          </p>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between gap-2">
            <p class="text-muted text-sm">Errores último minuto</p>
            <UBadge
              :color="stats.requestRate.lastMinute.serverError > 0 ? 'error' : 'success'"
              variant="subtle"
            >
              5xx
            </UBadge>
          </div>
          <p
            class="mt-3 text-3xl font-semibold"
            :class="stats.requestRate.lastMinute.serverError > 0 ? 'text-error' : ''"
          >
            {{ stats.requestRate.lastMinute.serverError }}
          </p>
          <p class="text-muted mt-2 text-xs">
            {{ stats.requestRate.lastMinute.clientError }} respuestas 4xx · 5 min:
            {{ stats.requestRate.last5Minutes.serverError }} ×5xx
          </p>
        </UCard>

        <UCard>
          <p class="text-muted text-sm">Newsletter backlog</p>
          <p class="mt-3 text-3xl font-semibold">{{ stats.queues.newsletter.waiting }}</p>
          <p class="text-muted mt-2 text-xs">
            Activos {{ stats.queues.newsletter.active }} · Fallidos
            {{ stats.queues.newsletter.failed }}
          </p>
        </UCard>

        <UCard>
          <div class="flex items-center justify-between gap-2">
            <p class="text-muted text-sm">Trabajos fallidos</p>
            <UBadge :color="recentFailuresTotal > 0 ? 'warning' : 'neutral'" variant="subtle">
              {{ recentFailuresTotal > 0 ? 'Recientes' : 'Estables' }}
            </UBadge>
          </div>
          <p class="mt-3 text-3xl font-semibold">{{ failedJobsTotal }}</p>
          <p class="text-muted mt-2 text-xs">
            Retenidos en cola · {{ recentFailuresTotal }} en los últimos 5 min
          </p>
        </UCard>
      </div>

      <UCard>
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-semibold">
              Tráfico (últimos {{ stats.requestRate.windowMinutes }} min)
            </h2>
            <p class="text-muted mt-1 text-sm">
              Media {{ stats.requestRate.last5Minutes.totalPerMinute }} pet./min en 5 min · puntos
              rojos marcan minutos con 5xx.
            </p>
          </div>
          <div class="text-right">
            <p class="text-2xl font-semibold">{{ stats.requestRate.last15Minutes.total }}</p>
            <p class="text-muted text-xs">peticiones en ventana</p>
          </div>
        </div>

        <div class="mt-4">
          <AdminSparkline :points="stats.requestRate.series" :width="640" :height="64" />
        </div>
      </UCard>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <h2 class="text-lg font-semibold">Infraestructura</h2>
          <p class="text-muted mt-1 text-sm">Estado de base de datos, Redis y proceso.</p>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">Base de datos</p>
                <UBadge
                  :color="stats.infrastructure.database.status === 'ok' ? 'success' : 'error'"
                  variant="subtle"
                >
                  {{ stats.infrastructure.database.status === 'ok' ? 'ok' : 'Error' }}
                </UBadge>
              </div>
              <dl class="text-muted mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt>Conexiones</dt>
                  <dd>
                    {{ stats.infrastructure.database.pool.totalCount }}/{{
                      stats.infrastructure.database.pool.maxConnections
                    }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Idle</dt>
                  <dd>{{ stats.infrastructure.database.pool.idleCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Esperando pool</dt>
                  <dd>{{ stats.infrastructure.database.pool.waitingCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Errores pool (total)</dt>
                  <dd>{{ stats.infrastructure.database.pool.errorCount }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Último error</dt>
                  <dd>{{ formatMetricDate(stats.infrastructure.database.pool.lastErrorAt) }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">Redis</p>
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
                  <dt>Clientes conectados</dt>
                  <dd>{{ stats.infrastructure.redis.server.connectedClients ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Memoria usada</dt>
                  <dd>{{ stats.infrastructure.redis.server.usedMemoryHuman ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Ratio aciertos</dt>
                  <dd>
                    {{
                      stats.infrastructure.redis.server.hitRate === null
                        ? '—'
                        : `${stats.infrastructure.redis.server.hitRate}%`
                    }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Claves expulsadas</dt>
                  <dd>{{ stats.infrastructure.redis.server.evictedKeys ?? '—' }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Uptime</dt>
                  <dd>{{ formatUptime(stats.infrastructure.redis.server.uptimeSeconds) }}</dd>
                </div>
              </dl>
              <p v-else class="text-muted mt-3 text-sm">
                {{
                  stats.infrastructure.redis.status === 'unconfigured'
                    ? 'Redis no está configurado en este entorno.'
                    : 'Sin datos de servidor disponibles.'
                }}
              </p>
            </div>

            <div class="rounded-2xl border p-4">
              <p class="font-medium">Proceso</p>
              <dl class="text-muted mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4">
                  <dt>Uptime</dt>
                  <dd>{{ formatUptime(stats.process.uptimeSeconds) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Memoria RSS</dt>
                  <dd>{{ formatBytes(stats.process.rssBytes) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Heap usado</dt>
                  <dd>
                    {{ formatBytes(stats.process.heapUsedBytes) }} /
                    {{ formatBytes(stats.process.heapTotalBytes) }}
                  </dd>
                </div>
              </dl>
            </div>

            <UCollapsible class="rounded-2xl border p-4">
              <button
                type="button"
                class="flex w-full items-center justify-between gap-3 text-left"
              >
                <span class="font-medium">Proxy de recursos</span>
                <UBadge color="neutral" variant="subtle">
                  {{ stats.infrastructure.externalAssetProxy.agent.origins }} orígenes
                </UBadge>
              </button>
              <template #content>
                <dl class="text-muted mt-3 space-y-2 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt>Conectadas</dt>
                    <dd>{{ stats.infrastructure.externalAssetProxy.agent.connected }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt>Libres</dt>
                    <dd>{{ stats.infrastructure.externalAssetProxy.agent.free }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt>Pendientes</dt>
                    <dd>{{ stats.infrastructure.externalAssetProxy.agent.pending }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt>En cola</dt>
                    <dd>{{ stats.infrastructure.externalAssetProxy.agent.queued }}</dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt>Límite/origen</dt>
                    <dd>
                      {{
                        stats.infrastructure.externalAssetProxy.agent.configuredConnectionsPerOrigin
                      }}
                    </dd>
                  </div>
                </dl>
              </template>
            </UCollapsible>
          </div>
        </UCard>

        <UCard>
          <h2 class="text-lg font-semibold">Colas y worker</h2>
          <p class="text-muted mt-1 text-sm">
            Backlog BullMQ, fallos recientes y estado de ejecución.
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
                <UBadge color="neutral" variant="subtle"
                  >{{ queue.waiting + queue.active + queue.delayed }} pendientes</UBadge
                >
              </div>

              <dl class="text-muted mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <div class="flex justify-between gap-4">
                  <dt>Waiting</dt>
                  <dd>{{ queue.waiting }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Active</dt>
                  <dd>{{ queue.active }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Delayed</dt>
                  <dd>{{ queue.delayed }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Failed</dt>
                  <dd :class="queue.failed > 0 ? 'text-error font-medium' : ''">
                    {{ queue.failed }}
                  </dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Completed</dt>
                  <dd>{{ queue.completed }}</dd>
                </div>
              </dl>

              <div v-if="queue.recentFailures.length" class="mt-4 space-y-2">
                <p class="text-muted text-xs font-medium tracking-wide uppercase">
                  Fallos retenidos
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
                        <span class="text-muted font-normal"
                          >· {{ job.attemptsMade }} intentos</span
                        >
                      </p>
                      <p class="text-muted mt-1 text-xs break-words">
                        {{ job.failedReason ?? 'Sin motivo registrado' }}
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
                      Reintentar
                    </UButton>
                  </div>
                </div>
              </div>
            </div>

            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">Worker de newsletter</p>
                <UBadge
                  :color="stats.newsletterWorker.activeRunCount > 0 ? 'warning' : 'success'"
                  variant="subtle"
                >
                  {{ stats.newsletterWorker.activeRunCount > 0 ? 'Procesando' : 'En reposo' }}
                </UBadge>
              </div>
              <p class="text-muted mt-3 text-sm">
                {{
                  stats.newsletterWorker.shutdownRequested
                    ? 'Hay una parada solicitada; los envíos terminarán o se reencolarán.'
                    : 'No hay parada pendiente.'
                }}
              </p>
              <ul
                v-if="stats.newsletterWorker.activeNewsletterIds.length"
                class="mt-3 space-y-2 text-sm"
              >
                <li
                  v-for="newsletterId in stats.newsletterWorker.activeNewsletterIds"
                  :key="newsletterId"
                  class="rounded-xl border px-3 py-2"
                >
                  Newsletter activa: <code>{{ newsletterId }}</code>
                </li>
              </ul>
            </div>
          </div>
        </UCard>
      </div>

      <UCard>
        <div>
          <h2 class="text-lg font-semibold">Endpoints lentos o con errores</h2>
          <p class="text-muted mt-1 text-sm">
            Se marca como lento desde {{ stats.requestRate.slowRequestThresholdMs }} ms; los 5xx se
            listan aparte.
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
                  Última vez: {{ formatMetricDate(endpoint.lastSeenAt) }} ·
                  {{ endpoint.totalCount }} peticiones
                </p>
              </div>

              <div class="grid gap-2 text-sm sm:grid-cols-4">
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">Media</div>
                  <div class="font-medium">{{ formatDuration(endpoint.averageDurationMs) }}</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">Máximo</div>
                  <div class="font-medium">{{ formatDuration(endpoint.maxDurationMs) }}</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">Lentas</div>
                  <div class="font-medium">{{ endpoint.slowCount }} ({{ endpoint.slowRate }}%)</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">Errores 5xx</div>
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
          <p class="text-muted">Todavía no hay endpoints lentos ni con errores registrados.</p>
        </div>
      </UCard>
    </template>
  </div>
</template>
