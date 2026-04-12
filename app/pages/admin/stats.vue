<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  title: 'Estado',
})

interface QueueStats {
  active: number
  completed: number
  delayed: number
  failed: number
  name: string
  waiting: number
}

interface MetricsResponse {
  data: {
    generatedAt: string
    infrastructure: {
      database: {
        pool: {
          errorCount: number
          idleCount: number
          lastErrorAt: string | null
          maxConnections: number
          totalCount: number
          waitingCount: number
        }
        status: 'ok' | 'error'
      }
      redis: {
        status: 'ok' | 'error' | 'unconfigured'
      }
    }
    newsletterWorker: {
      activeNewsletterIds: string[]
      activeRunCount: number
      shutdownRequested: boolean
    }
    queues: {
      maintenance: QueueStats
      newsletter: QueueStats
    }
    requestRate: {
      last15Minutes: {
        total: number
        totalPerMinute: number
      }
      last5Minutes: {
        total: number
        totalPerMinute: number
      }
      lastMinute: {
        admin: number
        api: number
        public: number
        total: number
      }
      slowRequestThresholdMs: number
    }
    slowEndpoints: Array<{
      averageDurationMs: number
      key: string
      lastSeenAt: string
      maxDurationMs: number
      slowCount: number
      slowRate: number
      totalCount: number
    }>
  }
}

const { data, error, pending, refresh } = await useFetch<MetricsResponse>('/api/admin/metrics', {
  lazy: true,
})
const { formatDateTime } = useLocaleFormatting()

const stats = computed(() => data.value?.data ?? null)

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

      <UButton variant="outline" color="neutral" icon="i-tabler-refresh" @click="refresh()">
        Actualizar
      </UButton>
    </section>

    <template v-if="pending">
      <div class="grid gap-4 xl:grid-cols-4">
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
        <USkeleton class="h-28 rounded-2xl" />
      </div>
      <USkeleton class="h-72 rounded-2xl" />
      <USkeleton class="h-72 rounded-2xl" />
    </template>

    <div v-else-if="error" class="space-y-3">
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
          <p class="text-muted text-sm">Media últimos 5 min</p>
          <p class="mt-3 text-3xl font-semibold">
            {{ stats.requestRate.last5Minutes.totalPerMinute }}
          </p>
          <p class="text-muted mt-2 text-xs">
            {{ stats.requestRate.last5Minutes.total }} peticiones acumuladas
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
          <p class="text-muted text-sm">Worker newsletter</p>
          <p class="mt-3 text-3xl font-semibold">{{ stats.newsletterWorker.activeRunCount }}</p>
          <p class="text-muted mt-2 text-xs">
            {{
              stats.newsletterWorker.shutdownRequested
                ? 'Apagado solicitado'
                : 'Sin apagado pendiente'
            }}
          </p>
        </UCard>
      </div>

      <div class="grid gap-4 xl:grid-cols-2">
        <UCard>
          <div class="flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold">Infraestructura</h2>
              <p class="text-muted mt-1 text-sm">
                Actualizado {{ formatMetricDate(stats.generatedAt) }}
              </p>
            </div>
          </div>

          <div class="mt-5 grid gap-4 md:grid-cols-2">
            <div class="rounded-2xl border p-4">
              <div class="flex items-center justify-between gap-3">
                <p class="font-medium">Base de datos</p>
                <UBadge
                  :color="stats.infrastructure.database.status === 'ok' ? 'success' : 'error'"
                  variant="subtle"
                >
                  {{ stats.infrastructure.database.status === 'ok' ? 'OK' : 'Error' }}
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
                  <dt>Errores pool</dt>
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

              <div class="mt-3 space-y-2 text-sm">
                <div class="flex justify-between gap-4 rounded-xl border px-3 py-2">
                  <span class="text-muted">Cola newsletter en espera</span>
                  <span>{{ stats.queues.newsletter.waiting }}</span>
                </div>
                <div class="flex justify-between gap-4 rounded-xl border px-3 py-2">
                  <span class="text-muted">Cola mantenimiento en espera</span>
                  <span>{{ stats.queues.maintenance.waiting }}</span>
                </div>
                <div class="flex justify-between gap-4 rounded-xl border px-3 py-2">
                  <span class="text-muted">Newsletter activas</span>
                  <span>{{ stats.newsletterWorker.activeNewsletterIds.length }}</span>
                </div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <div>
            <h2 class="text-lg font-semibold">Colas y worker</h2>
            <p class="text-muted mt-1 text-sm">Backlog BullMQ y estado de ejecución actual.</p>
          </div>

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
                  <dd>{{ queue.failed }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt>Completed</dt>
                  <dd>{{ queue.completed }}</dd>
                </div>
              </dl>
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
          <h2 class="text-lg font-semibold">Endpoints lentos</h2>
          <p class="text-muted mt-1 text-sm">
            Se marca como lento desde {{ stats.requestRate.slowRequestThresholdMs }} ms o si
            responde con 5xx.
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
                  Última vez: {{ formatMetricDate(endpoint.lastSeenAt) }}
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
                  <div class="font-medium">{{ endpoint.slowCount }}</div>
                </div>
                <div class="rounded-xl border px-3 py-2">
                  <div class="text-muted">Ratio lenta</div>
                  <div class="font-medium">{{ endpoint.slowRate }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="mt-5 rounded-2xl border px-4 py-10 text-center">
          <p class="text-muted">Todavía no hay endpoints lentos registrados.</p>
        </div>
      </UCard>
    </template>
  </div>
</template>
