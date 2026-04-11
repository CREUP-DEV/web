import { createError, getHeader, setHeader, setResponseStatus } from 'h3'
import { sql } from 'drizzle-orm'
import { db } from '../db'
import { getOptionalRuntimeConfigString } from '../utils/runtimeConfig'

// External API probe timeout — short enough to not block orchestrator health polls
const EXTERNAL_API_PROBE_TIMEOUT_MS = 3000

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

export default defineEventHandler(async (event) => {
  // Reject proxied requests — direct Docker health checks have no X-Forwarded-For header.
  if (getHeader(event, 'x-forwarded-for')) {
    throw createError({ statusCode: 404 })
  }

  setHeader(event, 'Cache-Control', 'no-store')

  const checks: Record<string, string> = {}
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok'

  // Database check — failure makes the app non-functional
  try {
    await db.execute(sql`SELECT 1`)
    checks.database = 'ok'
  } catch {
    checks.database = 'error'
    overallStatus = 'error'
  }

  // External API check — failure degrades but doesn't stop the app (cached data still served)
  const externalApiBaseUrl = getOptionalRuntimeConfigString(useRuntimeConfig().externalApiBaseUrl)

  if (externalApiBaseUrl) {
    const apiStatus = await probeExternalApi(externalApiBaseUrl)
    checks.externalApi = apiStatus

    if (apiStatus === 'error' && overallStatus === 'ok') {
      overallStatus = 'degraded'
    }
  } else {
    checks.externalApi = 'unconfigured'
  }

  if (overallStatus === 'error') {
    setResponseStatus(event, 503)
  }

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
  }
})
