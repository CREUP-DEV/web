import { createError, defineEventHandler, getRequestHeader, readBody, setResponseStatus } from 'h3'
import { getPublicApiErrorMessage } from '../utils/locale/apiErrorMessages'
import { logWarn } from '../utils/core/logger'
import { enforceRateLimit } from '../utils/public/rateLimit'
import { cspReportBodySchema, validatePublicBody } from '../utils/validation'

const MAX_CSP_REPORT_BYTES = 64 * 1024
const MAX_CSP_REPORT_FIELD_LENGTH = 512
// `original-policy` is dropped: it is our own CSP echoed back (no diagnostic value, very
// verbose). The rest are truncated and stripped of CR/LF before logging.
const CSP_REPORT_FIELDS = [
  'blocked-uri',
  'document-uri',
  'effective-directive',
  'line-number',
  'referrer',
  'source-file',
  'status-code',
  'violated-directive',
] as const

function getContentLength(event: Parameters<typeof getRequestHeader>[0]) {
  const rawContentLength = getRequestHeader(event, 'content-length')
  const contentLength = rawContentLength ? Number(rawContentLength) : 0

  return Number.isFinite(contentLength) ? contentLength : 0
}

function sanitizeReportValue(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  // Strip CR/LF so a crafted report can't forge extra log lines, and cap length.
  return value.replace(/[\r\n]+/g, ' ').slice(0, MAX_CSP_REPORT_FIELD_LENGTH)
}

function summarizeReport(report: Record<string, unknown>) {
  return Object.fromEntries(
    CSP_REPORT_FIELDS.flatMap((field) => {
      const value = report[field]

      if (value === undefined || value === null) {
        return []
      }

      return [[field, sanitizeReportValue(value)]]
    })
  )
}

function normalizeReports(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((entry): entry is Record<string, unknown> =>
      Boolean(entry && typeof entry === 'object')
    )
  }

  if (!payload || typeof payload !== 'object') {
    return []
  }

  const report = payload as Record<string, unknown>

  if (report['csp-report'] && typeof report['csp-report'] === 'object') {
    return [report['csp-report'] as Record<string, unknown>]
  }

  if (report.body && typeof report.body === 'object') {
    return [report.body as Record<string, unknown>]
  }

  return [report]
}

export default defineEventHandler(async (event) => {
  const contentLength = getContentLength(event)

  if (contentLength > MAX_CSP_REPORT_BYTES) {
    throw createError({
      statusCode: 413,
      message: getPublicApiErrorMessage(event, 'invalidInput'),
    })
  }

  await enforceRateLimit(event, {
    namespace: 'csp-report',
    maxRequests: 120,
    windowMs: 60 * 1000,
    errorMessage: getPublicApiErrorMessage(event, 'tooManyAttempts'),
  })

  const payload = validatePublicBody(event, cspReportBodySchema, await readBody(event))
  const reports = normalizeReports(payload).map(summarizeReport)

  if (reports.length > 0) {
    logWarn('security.csp-violation', { reports }, event)
  }

  setResponseStatus(event, 204)
  return null
})
