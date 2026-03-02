/**
 * Mandates list API endpoint
 * Proxies mandate data from the external CREUP intranet API.
 */

import { createError, defineEventHandler } from 'h3'
import { externalMandatesResponseSchema } from '../../utils/validation'

interface MandateOutput {
  id: number
  startDate: string
  endDate: string | null
  isCurrent: boolean
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()

  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const endpoint = new URL('/api/organigrama/mandatos', configuredBaseUrl).toString()

  let payload: unknown
  try {
    payload = await $fetch(endpoint)
  } catch (error) {
    console.error('Failed to fetch external mandates API:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandates data is temporarily unavailable.',
    })
  }

  const parsed = externalMandatesResponseSchema.safeParse(payload)
  if (!parsed.success) {
    console.error('Invalid payload from external mandates API:', parsed.error.flatten())
    throw createError({
      statusCode: 502,
      statusMessage: 'Mandates data is temporarily unavailable.',
    })
  }

  const mandates: MandateOutput[] = parsed.data.data
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((m) => ({
      id: m.id,
      startDate: m.start_date,
      endDate: m.end_date,
      isCurrent: m.is_current,
    }))

  return {
    mandates,
    generatedAt: parsed.data.generated_at ?? null,
  }
})
