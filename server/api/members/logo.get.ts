/**
 * Members logo proxy endpoint.
 * Avoids cross-site cookie issues by serving intranet images through this domain.
 */

import { createError, defineEventHandler, getQuery, setHeader } from 'h3'
import { membersLogoQuerySchema } from '../../utils/validation'

const normalizeOrigin = (value: string) => {
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return null
  }
}

const resolveSourceUrl = (src: string, baseUrl: string) => {
  try {
    return new URL(src)
  } catch {
    return new URL(src, baseUrl)
  }
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const configuredBaseUrl = String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
  const parsedQuery = membersLogoQuerySchema.safeParse(getQuery(event))

  if (!configuredBaseUrl || !parsedQuery.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid logo request.',
    })
  }

  const externalOrigin = normalizeOrigin(configuredBaseUrl)
  if (!externalOrigin) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const sourceUrl = resolveSourceUrl(parsedQuery.data.src, configuredBaseUrl)
  if (sourceUrl.origin !== externalOrigin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid logo origin.',
    })
  }

  let response: Response
  try {
    response = await fetch(sourceUrl.toString(), {
      headers: {
        Accept: 'image/*',
      },
      redirect: 'follow',
    })
  } catch (error) {
    console.error('Failed to fetch member logo:', error)
    throw createError({
      statusCode: 502,
      statusMessage: 'Member logo is temporarily unavailable.',
    })
  }

  if (!response.ok) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member logo not found.',
    })
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().startsWith('image/')) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Member logo not found.',
    })
  }

  const cacheControl = response.headers.get('cache-control') || 'public, max-age=3600'

  setHeader(event, 'content-type', contentType)
  setHeader(event, 'cache-control', cacheControl)

  const arrayBuffer = await response.arrayBuffer()
  return new Uint8Array(arrayBuffer)
})
