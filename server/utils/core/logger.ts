type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

interface LogEvent {
  headers?: Headers | { get(name: string): string | null | undefined }
  method?: string
  node?: {
    req?: {
      headers?: Record<string, string | string[] | undefined>
      url?: string
    }
  }
  path?: string
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

/**
 * drizzle-orm wraps every driver error in a DrizzleQueryError whose message (and so its stack)
 * reads `Failed query: <sql>` then `params: <values>` on the next line. The values are user data
 * — tokens, IPs, names, whole rich-text bodies — so the SQL is kept and the values are dropped.
 */
const QUERY_PARAMS_PATTERN = /(^|\n)params: [\s\S]*?(?=\n\s+at |$)/g

function sanitizeErrorText(value: string) {
  return sanitizeLogString(value.replace(QUERY_PARAMS_PATTERN, '$1params: [REDACTED]'))
}

/**
 * An error and its causes, each with its message, name and stack scrubbed, plus the Postgres
 * code and constraint when it has them (never `detail`, which quotes the offending values).
 */
function serializeErrorChain(error: Error, seen = new Set<Error>()): Record<string, unknown> {
  seen.add(error)
  const pg = error as Error & { code?: unknown; constraint?: unknown; cause?: unknown }
  const cause = pg.cause
  let serializedCause: unknown
  if (cause instanceof Error) {
    // A cause chain can loop (`err.cause = err`); stop at a repeat or after a few levels.
    serializedCause =
      seen.has(cause) || seen.size >= 5
        ? { name: cause.name, message: '[cause chain truncated]' }
        : serializeErrorChain(cause, seen)
  } else if (cause !== undefined) {
    serializedCause = sanitizeLogValue(cause)
  }

  return {
    message: sanitizeErrorText(error.message),
    name: error.name,
    ...(typeof pg.code === 'string' ? { code: pg.code } : {}),
    ...(typeof pg.constraint === 'string' ? { constraint: pg.constraint } : {}),
    stack: error.stack ? sanitizeErrorText(error.stack) : undefined,
    ...(serializedCause !== undefined ? { cause: serializedCause } : {}),
  }
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
    return serializeErrorChain(value)
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

  return serializeErrorChain(error)
}

function getEventPath(event: LogEvent): string | null {
  if (typeof event.path === 'string' && event.path.length > 0) {
    return event.path
  }

  const rawUrl = event.node?.req?.url
  if (typeof rawUrl !== 'string' || rawUrl.length === 0) {
    return null
  }

  try {
    return new URL(rawUrl, 'http://localhost').pathname
  } catch {
    return rawUrl.split('?')[0] || null
  }
}

function getEventHeader(event: LogEvent, name: string): string | null {
  const normalizedName = name.toLowerCase()

  if (event.headers && typeof event.headers.get === 'function') {
    return event.headers.get(name) ?? null
  }

  const headerValue = event.node?.req?.headers?.[normalizedName]
  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? null
  }

  return typeof headerValue === 'string' ? headerValue : null
}

function buildLogPayload(level: LogLevel, scope: string, meta: LogMeta = {}, event?: LogEvent) {
  const sanitizedMeta = sanitizeLogValue(meta) as Record<string, unknown>
  const payload: Record<string, unknown> = {
    level,
    scope,
    timestamp: new Date()
      .toLocaleString('sv-SE', {
        timeZone: process.env.TZ || 'Europe/Madrid',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        fractionalSecondDigits: 3,
      })
      .replace(' ', 'T'),
    ...sanitizedMeta,
  }

  if (event) {
    payload.method = event.method ?? null
    payload.path = getEventPath(event)
    payload.requestId = getEventHeader(event, 'x-request-id')
  }

  if ('error' in payload) {
    payload.error = serializeError(payload.error)
  }

  return payload
}

function writeLog(level: LogLevel, scope: string, meta?: LogMeta, event?: LogEvent) {
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

export function logInfo(scope: string, meta?: LogMeta, event?: LogEvent) {
  writeLog('info', scope, meta, event)
}

export function logWarn(scope: string, meta?: LogMeta, event?: LogEvent) {
  writeLog('warn', scope, meta, event)
}

export function logError(scope: string, error: unknown, meta?: LogMeta, event?: LogEvent) {
  writeLog('error', scope, { ...meta, error }, event)
}
