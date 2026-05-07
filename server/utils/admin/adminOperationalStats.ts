import { sql } from 'drizzle-orm'
import { db, getDatabasePoolStats } from '../../db'
import { getNewsletterDeliveryRuntimeState } from '../../services/newsletterDeliveryService'
import {
  BACKGROUND_QUEUE_NAMES,
  getMaintenanceQueue,
  getNewsletterQueue,
} from '../core/backgroundJobs'
import { getExternalAssetProxyAgentStats } from '../external/externalAssetProxyConfig'
import { getRequestMetricsSummary } from '../core/requestMetrics'
import { getRedisClient } from '../cache/redis'
import { getOptionalRuntimeConfigString } from '../core/runtimeConfig'

async function getInfrastructureStatus() {
  const runtimeConfig = useRuntimeConfig()
  const redisConfigured = Boolean(getOptionalRuntimeConfigString(runtimeConfig.redisUrl))

  const [databaseStatus, redisStatus] = await Promise.all([
    db
      .execute(sql`SELECT 1`)
      .then(() => 'ok' as const)
      .catch(() => 'error' as const),
    !redisConfigured
      ? Promise.resolve('unconfigured' as const)
      : getRedisClient()
          .ping()
          .then((result) => (result === 'PONG' ? ('ok' as const) : ('error' as const)))
          .catch(() => 'error' as const),
  ])

  return {
    database: {
      pool: getDatabasePoolStats(),
      status: databaseStatus,
    },
    externalAssetProxy: {
      agent: getExternalAssetProxyAgentStats(),
    },
    redis: {
      status: redisStatus,
    },
  }
}

async function getQueueStats() {
  const [newsletterCounts, maintenanceCounts] = await Promise.all([
    getNewsletterQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
    getMaintenanceQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
  ])

  return {
    maintenance: {
      name: BACKGROUND_QUEUE_NAMES.maintenance,
      ...maintenanceCounts,
    },
    newsletter: {
      name: BACKGROUND_QUEUE_NAMES.newsletter,
      ...newsletterCounts,
    },
  }
}

export async function getAdminOperationalStats() {
  const [infrastructure, queues] = await Promise.all([getInfrastructureStatus(), getQueueStats()])

  return {
    generatedAt: new Date().toISOString(),
    infrastructure,
    newsletterWorker: getNewsletterDeliveryRuntimeState(),
    queues,
    ...getRequestMetricsSummary(),
  }
}
