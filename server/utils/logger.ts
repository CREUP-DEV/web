import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

const SENSITIVE_KEY_PATTERN =
  /(?:^|[_-])(password|pass|secret|token|authorization|cookie|apikey|api_key|access_token|refresh_token|confirm_token|unsubscribe_token)(?:$|[_-])/i
const EMAIL_KEY_PATTERN = /(?:^|[_-])email(?:$|[_-])/i
const EMAIL_VALUE_PATTERN = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    Boolean(value) && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype
  )
}

function sanitizeLogString(value: string) {
  return value.replace(EMAIL_VALUE_PATTERN, '[REDACTED_EMAIL]')
}

function sanitizeLogValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === 'string') {
    return sanitizeLogString(value)
  }

  if (typeof value !== 'object') {
    return value
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item))
  }

  if (value instanceof Error) {
    return {
      message: sanitizeLogString(value.message),
      name: value.name,
      stack: value.stack ? sanitizeLogString(value.stack) : undefined,
    }
  }

  if (!isPlainObject(value)) {
    return value
  }

  return Object.fromEntries(
    Object.entries(value).map(([entryKey, entryValue]) => {
      const normalizedKey = entryKey.toLowerCase()
      const shouldRedact =
        SENSITIVE_KEY_PATTERN.test(normalizedKey) || EMAIL_KEY_PATTERN.test(normalizedKey)

      if (shouldRedact) {
        return [entryKey, '[REDACTED]']
      }

      return [entryKey, sanitizeLogValue(entryValue)]
    })
  )
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return sanitizeLogValue(error)
  }

  return {
    message: sanitizeLogString(error.message),
    name: error.name,
    stack: error.stack ? sanitizeLogString(error.stack) : undefined,
  }
}

function buildLogPayload(level: LogLevel, scope: string, meta: LogMeta = {}, event?: H3Event) {
  const sanitizedMeta = sanitizeLogValue(meta) as Record<string, unknown>
  const payload: Record<string, unknown> = {
    level,
    scope,
    timestamp: new Date().toISOString(),
    ...sanitizedMeta,
  }

  if (event) {
    payload.method = event.method
    payload.path = getRequestURL(event).pathname
    payload.requestId = event.headers.get('x-request-id') || null
  }

  if ('error' in payload) {
    payload.error = serializeError(payload.error)
  }

  return payload
}

function writeLog(level: LogLevel, scope: string, meta?: LogMeta, event?: H3Event) {
  const payload = buildLogPayload(level, scope, meta, event)
  const message = JSON.stringify(payload)

  if (level === 'error') {
    console.error(message)
    return
  }

  if (level === 'warn') {
    console.warn(message)
    return
  }

  console.info(message)
}

export function logInfo(scope: string, meta?: LogMeta, event?: H3Event) {
  writeLog('info', scope, meta, event)
}

export function logWarn(scope: string, meta?: LogMeta, event?: H3Event) {
  writeLog('warn', scope, meta, event)
}

export function logError(scope: string, error: unknown, meta?: LogMeta, event?: H3Event) {
  writeLog('error', scope, { ...meta, error }, event)
}
