import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getClientIp } from './urlBuilder'

// NOTE: This rate limiter trusts the x-forwarded-for header set by the reverse proxy.
// The application MUST run behind NGINX (or equivalent) that overwrites x-forwarded-for
// with the real client IP. Without a trusted proxy, the rate limiter is bypassable.
// NOTE: The default cache storage is process-local and may be cleared on restart/redeploy.
// Use a shared storage backend if rate limits must survive process restarts.

interface RateLimitRecord {
  count: number
  expiresAt: number
}

interface RateLimitOptions {
  namespace: string
  maxRequests: number
  windowMs: number
  errorMessage: string
}

export async function enforceRateLimit(event: H3Event, options: RateLimitOptions) {
  const storage = useStorage('cache')
  const clientIp = getClientIp(event) || 'unknown'
  const key = `rate-limit:${options.namespace}:${clientIp}`
  const now = Date.now()
  const existing = await storage.getItem<RateLimitRecord>(key)

  if (!existing || existing.expiresAt <= now) {
    await storage.setItem<RateLimitRecord>(key, {
      count: 1,
      expiresAt: now + options.windowMs,
    })
    return
  }

  if (existing.count >= options.maxRequests) {
    throw createError({
      statusCode: 429,
      statusMessage: options.errorMessage,
    })
  }

  await storage.setItem<RateLimitRecord>(key, {
    ...existing,
    count: existing.count + 1,
  })
}
