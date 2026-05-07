import { createError, getHeader, setHeader, setResponseStatus } from 'h3'
import type { H3Event } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import { getOptionalRuntimeConfigString } from '../utils/core/runtimeConfig'
import { getRedisClient } from '../utils/cache/redis'
import { getSmtpTransporter } from '../utils/email/smtpTransporter'
import { getExternalAssetProxyAgentStats } from '../utils/external/externalAssetProxyConfig'

// External API probe timeout — short enough to not block orchestrator health polls
const DATABASE_PROBE_TIMEOUT_MS = 5000
const EXTERNAL_API_PROBE_TIMEOUT_MS = 3000
const SMTP_PROBE_TIMEOUT_MS = 5000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Health probe timeout')), timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

async function probeExternalApi(baseUrl: string): Promise<'ok' | 'error'> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), EXTERNAL_API_PROBE_TIMEOUT_MS)

  try {
    // Any HTTP response (including 4xx/5xx) means the server is reachable.
    // Only network errors or timeouts are treated as unavailable.
    await fetch(baseUrl, { method: 'HEAD', signal: controller.signal })
    return 'ok'
  } catch {
    return 'error'
  } finally {
    clearTimeout(timeoutId)
  }
}

async function probeRedis(event: H3Event): Promise<'ok' | 'error'> {
  try {
    const redis = getRedisClient(event)
    const result = await redis.ping()
    return result === 'PONG' ? 'ok' : 'error'
  } catch {
    return 'error'
  }
}

function isSmtpConfigured(event: H3Event): boolean {
  const runtimeConfig = useRuntimeConfig(event)
  const requiredSmtpConfigValues = [
    runtimeConfig.smtpHost,
    runtimeConfig.smtpPort,
    runtimeConfig.smtpSecure,
    runtimeConfig.smtpUser,
    runtimeConfig.smtpPass,
  ]

  return requiredSmtpConfigValues.every((value) => Boolean(getOptionalRuntimeConfigString(value)))
}

async function probeSmtp(event: H3Event): Promise<'ok' | 'error' | 'unconfigured'> {
  if (!isSmtpConfigured(event)) {
    return 'unconfigured'
  }

  try {
    const transporter = getSmtpTransporter()
    await withTimeout(
      transporter.verify().then(() => undefined),
      SMTP_PROBE_TIMEOUT_MS
    )
    return 'ok'
  } catch {
    return 'error'
  }
}

export default defineEventHandler(async (event) => {
  // Reject proxied requests — direct Docker health checks have no X-Forwarded-For header.
  if (getHeader(event, 'x-forwarded-for')) {
    throw createError({ statusCode: 404 })
  }

  setHeader(event, 'Cache-Control', 'no-store')

  const checks: Record<string, string> = {}
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok'
  const runtimeConfig = useRuntimeConfig(event)

  // Database check — failure makes the app non-functional
  try {
    await withTimeout(
      db.execute(sql`SELECT 1`).then(() => undefined),
      DATABASE_PROBE_TIMEOUT_MS
    )
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    overallStatus = 'error'
  }

  // Redis check — required by rate limiting, cache coordination and background jobs
  const redisUrl = getOptionalRuntimeConfigString(runtimeConfig.redisUrl)
  if (!redisUrl) {
    checks.redis = 'unconfigured'
    if (overallStatus === 'ok') {
      overallStatus = 'degraded'
    }
  } else {
    const redisStatus = await probeRedis(event)
    checks.redis = redisStatus

    if (redisStatus === 'error' && overallStatus === 'ok') {
      overallStatus = 'degraded'
    }
  }

  // External API check — failure degrades but doesn't stop the app (cached data still served)
  const externalApiBaseUrl = getOptionalRuntimeConfigString(runtimeConfig.externalApiBaseUrl)

  if (externalApiBaseUrl) {
    const apiStatus = await probeExternalApi(externalApiBaseUrl)
    checks.externalApi = apiStatus

    if (apiStatus === 'error' && overallStatus === 'ok') {
      overallStatus = 'degraded'
    }
  } else {
    checks.externalApi = 'unconfigured'
  }

  // SMTP check — impacts contact and newsletter email delivery flows
  const smtpStatus = await probeSmtp(event)
  checks.smtp = smtpStatus

  if (smtpStatus === 'error' && overallStatus === 'ok') {
    overallStatus = 'degraded'
  }

  if (overallStatus === 'error') {
    setResponseStatus(event, 503)
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    metrics: {
      externalAssetProxy: getExternalAssetProxyAgentStats(),
    },
  }
})
