/**
 * Mandate by date slug API endpoint
 *
 * Resolves a mandate from a date-based URL slug:
 *   - YYYY         → matches mandate(s) whose startDate begins with that year
 *   - YYYY-MM      → matches mandate(s) whose startDate begins with that year-month
 *   - YYYY-MM-DD   → matches mandate(s) whose startDate equals that date
 *
 * Response shapes:
 *   - Exactly 1 match  → { ambiguous: false, mandate, areas, generatedAt }
 *   - Multiple matches → { ambiguous: true, mandates: MandateInfoOutput[] }
 *   - No match         → 404
 */

import { createError, defineEventHandler, getRouterParam } from 'h3'
import {
  getExternalApiCacheOptions,
  setExternalApiCacheHeaders,
} from '../../../../utils/externalApiCache'
import { fetchMandatesList, fetchMandateDetail } from '../../../../utils/mandateDetail'

const SLUG_RE = /^\d{4}(-\d{2}(-\d{2})?)?$/

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
  const cacheOptions = getExternalApiCacheOptions(event)

  setExternalApiCacheHeaders(event, cacheOptions)

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const slug = getRouterParam(event, 'slug')

  if (!slug || !SLUG_RE.test(slug)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid mandate slug. Expected YYYY, YYYY-MM or YYYY-MM-DD.',
    })
  }

  const mandates = await fetchMandatesList(configuredBaseUrl, cacheOptions)
  const matches = mandates.filter((m) => m.startDate.startsWith(slug))

  if (matches.length === 0) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No mandate found for the given date.',
    })
  }

  // More than one mandate matches → the caller should show a disambiguation UI
  if (matches.length > 1) {
    return {
      ambiguous: true as const,
      mandates: matches,
    }
  }

  // Single match — return full detail
  const detail = await fetchMandateDetail(configuredBaseUrl, matches[0]!.id, cacheOptions, event)

  return {
    ambiguous: false as const,
    ...detail,
  }
})
