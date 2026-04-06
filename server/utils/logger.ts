import type { H3Event } from 'h3'
import { getRequestURL } from 'h3'

type LogLevel = 'info' | 'warn' | 'error'

interface LogMeta {
  [key: string]: unknown
}

function serializeError(error: unknown) {
  if (!(error instanceof Error)) {
    return error
  }

  return {
    message: error.message,
    name: error.name,
    stack: error.stack,
  }
}

function buildLogPayload(level: LogLevel, scope: string, meta: LogMeta = {}, event?: H3Event) {
  const payload: Record<string, unknown> = {
    level,
    scope,
    timestamp: new Date().toISOString(),
    ...meta,
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
