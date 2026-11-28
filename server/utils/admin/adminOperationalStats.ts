import { and, eq, inArray, sql } from 'drizzle-orm'
import { db, getDatabasePoolStats } from '../../db'
import { newsletterCampaignTranslations } from '../../db/schema/newsletterCampaigns'
import { DEFAULT_LOCALE_CODE } from '~~/shared/constants/locales'
import { getNewsletterCampaignDeliveryRuntimeState } from '../../services/newsletterCampaignDeliveryService'
import {
  BACKGROUND_QUEUE_NAMES,
  getMaintenanceQueue,
  getNewsletterQueue,
  getRecentFailedJobs,
  type FailedJobSummary,
} from '../core/backgroundJobs'
import { getExternalAssetProxyAgentStats } from '../external/externalAssetProxyConfig'
import { getRequestMetricsSummary } from '../core/requestMetrics'
import { getRedisClient, getRedisServerStats } from '../cache/redis'
import { getOptionalRuntimeConfigString } from '../core/runtimeConfig'

const RECENT_INCIDENT_WINDOW_MS = 5 * 60 * 1000
const PROCESS_STARTED_AT = new Date(Date.now() - process.uptime() * 1000).toISOString()

/**
 * Why the verdict is not `ok`, as codes the admin translates (with `count` for its plural), never
 * as text built here.
 */
export type AdminHealthReason =
  | { code: 'databaseDown' }
  | { code: 'redisDown' }
  | { code: 'serverErrors'; count: number }
  | { code: 'poolError' }
  | { code: 'jobFailures'; count: number }

async function getInfrastructureStatus() {
  const runtimeConfig = useRuntimeConfig()
  const redisConfigured = Boolean(getOptionalRuntimeConfigString(runtimeConfig.redisUrl))

  const [databaseStatus, redisStatus, redisServer] = await Promise.all([
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
    redisConfigured ? getRedisServerStats() : Promise.resolve(null),
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
      server: redisServer,
      status: redisStatus,
    },
  }
}

async function getQueueStats() {
  const [newsletterCounts, maintenanceCounts, newsletterFailed, maintenanceFailed] =
    await Promise.all([
      getNewsletterQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
      getMaintenanceQueue().getJobCounts('waiting', 'active', 'delayed', 'failed', 'completed'),
      getRecentFailedJobs(BACKGROUND_QUEUE_NAMES.newsletter),
      getRecentFailedJobs(BACKGROUND_QUEUE_NAMES.maintenance),
    ])

  // getJobCounts() returns an index-signature record; project the fields we use
  // onto concrete properties so the inferred (and serialized) response keeps them.
  const projectCounts = (counts: Record<string, number>) => ({
    active: counts.active ?? 0,
    completed: counts.completed ?? 0,
    delayed: counts.delayed ?? 0,
    failed: counts.failed ?? 0,
    waiting: counts.waiting ?? 0,
  })

  // getRecentFailedJobs() returns the retained failed jobs, which may be old.
  // Count only those failed within the incident window so the UI can distinguish
  // "failing now" from "lingering historical failures".
  const nowMs = Date.now()
  const countRecentFailures = (jobs: FailedJobSummary[]) =>
    jobs.filter((job) => isRecent(job.failedAt, nowMs)).length

  return {
    maintenance: {
      name: BACKGROUND_QUEUE_NAMES.maintenance,
      recentFailureCount: countRecentFailures(maintenanceFailed),
      recentFailures: maintenanceFailed,
      ...projectCounts(maintenanceCounts),
    },
    newsletter: {
      name: BACKGROUND_QUEUE_NAMES.newsletter,
      recentFailureCount: countRecentFailures(newsletterFailed),
      recentFailures: newsletterFailed,
      ...projectCounts(newsletterCounts),
    },
  }
}

function getProcessVitals() {
  const memory = process.memoryUsage()

  return {
    heapTotalBytes: memory.heapTotal,
    heapUsedBytes: memory.heapUsed,
    rssBytes: memory.rss,
    /** When this process started: the last deploy or restart. */
    startedAt: PROCESS_STARTED_AT,
    uptimeSeconds: Math.round(process.uptime()),
  }
}

function isRecent(timestamp: string | null, nowMs: number) {
  if (!timestamp) {
    return false
  }

  const parsed = Date.parse(timestamp)
  return Number.isFinite(parsed) && nowMs - parsed <= RECENT_INCIDENT_WINDOW_MS
}

/**
 * Derives a single overall verdict from *recent, transient* signals only.
 * Cumulative counters (pool.errorCount, lingering failed jobs kept by
 * removeOnFail) are deliberately excluded so the badge reflects current health
 * rather than getting stuck "degraded" forever after one historical incident.
 */
function deriveHealth(input: {
  databaseStatus: 'ok' | 'error'
  redisStatus: 'ok' | 'error' | 'unconfigured'
  /** 5xx responses in the last five minutes, the same window as the job failures. */
  recentServerErrors: number
  poolLastErrorAt: string | null
  recentFailures: FailedJobSummary[]
}) {
  const nowMs = Date.now()
  const reasons: AdminHealthReason[] = []

  if (input.databaseStatus === 'error') {
    reasons.push({ code: 'databaseDown' })
  }

  if (input.redisStatus === 'error') {
    reasons.push({ code: 'redisDown' })
  }

  if (input.recentServerErrors > 0) {
    reasons.push({ code: 'serverErrors', count: input.recentServerErrors })
  }

  if (isRecent(input.poolLastErrorAt, nowMs)) {
    reasons.push({ code: 'poolError' })
  }

  const recentJobFailures = input.recentFailures.filter((job) => isRecent(job.failedAt, nowMs))
  if (recentJobFailures.length > 0) {
    reasons.push({ code: 'jobFailures', count: recentJobFailures.length })
  }

  const status: 'ok' | 'degraded' | 'down' =
    input.databaseStatus === 'error' ? 'down' : reasons.length > 0 ? 'degraded' : 'ok'

  return { reasons, status }
}

/**
 * The campaigns the newsletter worker is sending right now, by their default-locale subject, so the
 * page can name and link them instead of showing bare ids.
 */
async function getActiveCampaigns(ids: string[]) {
  if (ids.length === 0) return []

  const rows = await db
    .select({
      id: newsletterCampaignTranslations.campaignId,
      subject: newsletterCampaignTranslations.subject,
    })
    .from(newsletterCampaignTranslations)
    .where(
      and(
        inArray(newsletterCampaignTranslations.campaignId, ids),
        eq(newsletterCampaignTranslations.locale, DEFAULT_LOCALE_CODE)
      )
    )
    .catch(() => [])
  const subjects = new Map(rows.map((row) => [row.id, row.subject]))

  return ids.map((id) => ({ id, subject: subjects.get(id) ?? null }))
}

export async function getAdminOperationalStats() {
  const [infrastructure, queues] = await Promise.all([getInfrastructureStatus(), getQueueStats()])
  const requestMetrics = getRequestMetricsSummary()

  const health = deriveHealth({
    databaseStatus: infrastructure.database.status,
    recentServerErrors: requestMetrics.requestRate.last5Minutes.serverError,
    poolLastErrorAt: infrastructure.database.pool.lastErrorAt,
    recentFailures: [...queues.newsletter.recentFailures, ...queues.maintenance.recentFailures],
    redisStatus: infrastructure.redis.status,
  })

  const newsletterWorker = getNewsletterCampaignDeliveryRuntimeState()

  return {
    generatedAt: new Date().toISOString(),
    health,
    infrastructure,
    newsletterWorker: {
      ...newsletterWorker,
      activeCampaigns: await getActiveCampaigns(newsletterWorker.activeCampaignIds),
    },
    process: getProcessVitals(),
    queues,
    ...requestMetrics,
  }
}
