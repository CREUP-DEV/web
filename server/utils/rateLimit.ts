import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getClientIp } from './urlBuilder'

// NOTE: This rate limiter uses a module-level Map for atomic in-process rate limiting.
// Node.js is single-threaded, so synchronous Map operations have no race conditions.
// The map is process-local and cleared on restart/redeploy — this is intentional for
// a low-volume public form protection layer that does not need persistence.
// IMPORTANT: The app MUST run behind NGINX (or equivalent) that overwrites
// x-forwarded-for with the real client IP. Without a trusted proxy, this is bypassable.

interface RateLimitRecord {
  count: number
  expiresAt: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Periodic cleanup to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore) {
    if (record.expiresAt <= now) {
      rateLimitStore.delete(key)
    }
  }
}, 60_000)

interface RateLimitOptions {
  namespace: string
  maxRequests: number
  windowMs: number
  errorMessage: string
}

export function enforceRateLimit(event: H3Event, options: RateLimitOptions): void {
  const clientIp = getClientIp(event) || 'unknown'
  const key = `rate-limit:${options.namespace}:${clientIp}`
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing || existing.expiresAt <= now) {
    rateLimitStore.set(key, { count: 1, expiresAt: now + options.windowMs })
    return
  }

  if (existing.count >= options.maxRequests) {
    throw createError({
      statusCode: 429,
      message: options.errorMessage,
    })
  }

  existing.count++
}
