import type { H3Event } from 'h3'
import { createError, getHeader, getMethod, getQuery, getRequestURL } from 'h3'
import {
  getRequiredExternalAssetProxyImageMaxBytes,
  getRequiredExternalAssetProxyPdfMaxBytes,
  getRequiredExternalAssetProxyTimeoutMs,
} from '../core/runtimeConfig'
import { logError } from '../core/logger'
import { externalAssetQuerySchema } from '../validation'
import {
  externalAssetProxyDispatcher,
  getExternalAssetProxyConfig,
  getPublicMessage,
  type ExternalAssetType,
} from './externalAssetProxyConfig'
import { fetchExternalAssetWithSafeRedirects } from './externalAssetFetch'
import { resolveSourceFromPublicPath, resolveSourceUrl } from './externalAssetUrl'

const DEFAULT_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
const CACHE_CONTROL_FLOOR_SECONDS = 24 * 60 * 60

const getAssetAcceptHeader = (type: ExternalAssetType) => {
  if (type === 'image') {
    return 'image/*'
  }
  return 'application/pdf,application/octet-stream;q=0.9,*/*;q=0.1'
}

const isValidAssetContentType = (
  type: ExternalAssetType,
  contentType: string,
  sourcePathname: string
) => {
  const normalizedContentType = contentType.toLowerCase()

  if (type === 'image') {
    return normalizedContentType.startsWith('image/')
  }

  if (normalizedContentType.includes('application/pdf')) {
    return true
  }

  if (
    normalizedContentType.includes('application/octet-stream') &&
    sourcePathname.toLowerCase().endsWith('.pdf')
  ) {
    return true
  }

  return false
}

const getMaxBytesForType = (event: H3Event, type: ExternalAssetType) => {
  if (type === 'image') {
    return getRequiredExternalAssetProxyImageMaxBytes(event)
  }

  return getRequiredExternalAssetProxyPdfMaxBytes(event)
}

interface ParsedCacheControl {
  hasNoCache: boolean
  hasNoStore: boolean
  maxAgeSeconds: number | null
  sMaxAgeSeconds: number | null
}

const parseCacheControlHeader = (value: string): ParsedCacheControl | null => {
  let maxAgeSeconds: number | null = null
  let sMaxAgeSeconds: number | null = null
  let hasNoCache = false
  let hasNoStore = false
  let sawSupportedDirective = false

  for (const directive of value.split(',')) {
    const normalizedDirective = directive.trim().toLowerCase()

    if (!normalizedDirective) {
      continue
    }

    if (normalizedDirective === 'no-cache') {
      hasNoCache = true
      sawSupportedDirective = true
      continue
    }

    if (normalizedDirective === 'no-store') {
      hasNoStore = true
      sawSupportedDirective = true
      continue
    }

    const maxAgeMatch = /^(s-maxage|max-age)=(\d+)$/.exec(normalizedDirective)
    if (maxAgeMatch) {
      const seconds = Number(maxAgeMatch[2])
      if (Number.isFinite(seconds)) {
        sawSupportedDirective = true
        if (maxAgeMatch[1] === 's-maxage') {
          sMaxAgeSeconds = seconds
        } else {
          maxAgeSeconds = seconds
        }
      }
    }
  }

  if (!sawSupportedDirective) {
    return null
  }

  return {
    hasNoCache,
    hasNoStore,
    maxAgeSeconds,
    sMaxAgeSeconds,
  }
}

const buildCacheControlHeader = (upstreamCacheControl: string | null) => {
  if (!upstreamCacheControl) {
    return DEFAULT_CACHE_CONTROL
  }

  const parsed = parseCacheControlHeader(upstreamCacheControl)
  if (!parsed) {
    return DEFAULT_CACHE_CONTROL
  }

  if (parsed.hasNoCache || parsed.hasNoStore) {
    return DEFAULT_CACHE_CONTROL
  }

  const maxAgeSeconds = Math.max(parsed.maxAgeSeconds ?? -1, parsed.sMaxAgeSeconds ?? -1)
  if (maxAgeSeconds >= CACHE_CONTROL_FLOOR_SECONDS) {
    return upstreamCacheControl
  }

  return DEFAULT_CACHE_CONTROL
}

const buildOutgoingHeaders = (
  upstreamResponse: Response,
  type: ExternalAssetType,
  method: string
) => {
  const headers = new Headers()

  headers.set(
    'cache-control',
    buildCacheControlHeader(upstreamResponse.headers.get('cache-control'))
  )
  headers.set('x-content-type-options', 'nosniff')

  const contentType = upstreamResponse.headers.get('content-type')
  if (type === 'pdf') {
    headers.set('content-type', 'application/pdf')
  } else if (contentType) {
    headers.set('content-type', contentType)
  }

  const contentLength = upstreamResponse.headers.get('content-length')
  if (contentLength && method !== 'HEAD') {
    headers.set('content-length', contentLength)
  }

  const contentRange = upstreamResponse.headers.get('content-range')
  if (contentRange) {
    headers.set('content-range', contentRange)
  }

  const acceptRanges = upstreamResponse.headers.get('accept-ranges')
  if (acceptRanges) {
    headers.set('accept-ranges', acceptRanges)
  } else if (type === 'pdf') {
    headers.set('accept-ranges', 'bytes')
  }

  const etag = upstreamResponse.headers.get('etag')
  if (etag) {
    headers.set('etag', etag)
  }

  const lastModified = upstreamResponse.headers.get('last-modified')
  if (lastModified) {
    headers.set('last-modified', lastModified)
  }

  if (type === 'pdf') {
    headers.set('content-disposition', 'inline')
  } else {
    const contentDisposition = upstreamResponse.headers.get('content-disposition')
    if (contentDisposition) {
      headers.set('content-disposition', contentDisposition)
    }
  }

  return headers
}

export const proxyExternalAssetBySource = async (
  event: H3Event,
  type: ExternalAssetType,
  source: string
) => {
  const method = getMethod(event).toUpperCase()
  const requestHeaders = new Headers()
  if (method !== 'GET' && method !== 'HEAD') {
    throw createError({
      statusCode: 405,
      message: getPublicMessage('methodNotAllowed', event),
    })
  }

  const normalizedSource = source.trim()
  const { allowedOrigins, assetBaseUrl: configuredBaseUrl } = getExternalAssetProxyConfig(event)

  if (allowedOrigins.size === 0) {
    throw createError({
      statusCode: 500,
      message: getPublicMessage('assetProxyNotConfigured', event),
    })
  }

  const sourceUrl = resolveSourceUrl(normalizedSource, configuredBaseUrl)

  if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidProtocol', event),
    })
  }

  if (sourceUrl.username || sourceUrl.password) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidCredentials', event),
    })
  }

  if (!allowedOrigins.has(sourceUrl.origin)) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidOrigin', event),
    })
  }

  const timeoutMs = getRequiredExternalAssetProxyTimeoutMs(event)
  const maxBytes = getMaxBytesForType(event, type)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    requestHeaders.set('accept', getAssetAcceptHeader(type))

    const rangeHeader = getHeader(event, 'range')
    if (rangeHeader) {
      requestHeaders.set('range', rangeHeader)
    }

    const ifNoneMatchHeader = getHeader(event, 'if-none-match')
    if (ifNoneMatchHeader) {
      requestHeaders.set('if-none-match', ifNoneMatchHeader)
    }

    const ifModifiedSinceHeader = getHeader(event, 'if-modified-since')
    if (ifModifiedSinceHeader) {
      requestHeaders.set('if-modified-since', ifModifiedSinceHeader)
    }

    const ifRangeHeader = getHeader(event, 'if-range')
    if (ifRangeHeader) {
      requestHeaders.set('if-range', ifRangeHeader)
    }

    const upstreamResponse = await fetchExternalAssetWithSafeRedirects(sourceUrl.toString(), {
      allowedOrigins,
      createError: (reason) => {
        if (reason === 'invalid_protocol') {
          return createError({
            statusCode: 400,
            message: getPublicMessage('assetInvalidProtocol', event),
          })
        }

        if (reason === 'invalid_origin' || reason === 'invalid_url') {
          return createError({
            statusCode: 400,
            message: getPublicMessage('assetInvalidOrigin', event),
          })
        }

        return createError({
          statusCode: 502,
          message: getPublicMessage('assetUnavailable', event),
        })
      },
      dispatcher: externalAssetProxyDispatcher,
      headers: requestHeaders,
      method: method === 'HEAD' ? 'HEAD' : 'GET',
      signal: controller.signal,
    })

    if (upstreamResponse.status === 404) {
      throw createError({
        statusCode: 404,
        message: getPublicMessage('assetNotFound', event),
      })
    }

    if (![200, 206, 304].includes(upstreamResponse.status)) {
      throw createError({
        statusCode: 502,
        message: getPublicMessage('assetUnavailable', event),
      })
    }

    if (upstreamResponse.status !== 304) {
      const contentType = upstreamResponse.headers.get('content-type') ?? ''
      if (!isValidAssetContentType(type, contentType, sourceUrl.pathname)) {
        throw createError({
          statusCode: 415,
          message: getPublicMessage('assetUnsupportedType', event),
        })
      }

      const contentLength = Number(upstreamResponse.headers.get('content-length') ?? '')
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw createError({
          statusCode: 413,
          message: getPublicMessage('assetTooLarge', event),
        })
      }
    }

    const headers = buildOutgoingHeaders(upstreamResponse, type, method)
    let body: ReadableStream | null = null
    if (method !== 'HEAD' && upstreamResponse.status !== 304 && upstreamResponse.body) {
      let bytesRead = 0
      const transform = new TransformStream({
        transform(chunk, controller) {
          bytesRead += chunk.byteLength
          if (bytesRead > maxBytes) {
            controller.error(new Error('Asset exceeds size limit'))
            return
          }
          controller.enqueue(chunk)
        },
      })
      body = upstreamResponse.body.pipeThrough(transform)
    }

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        message: getPublicMessage('assetTimedOut', event),
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logError('external-asset.proxy', error, { source: normalizedSource, type }, event)
    throw createError({
      statusCode: 502,
      message: getPublicMessage('assetUnavailable', event),
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function proxyExternalAsset(event: H3Event, type: ExternalAssetType) {
  const parsedQuery = externalAssetQuerySchema.safeParse(getQuery(event))
  if (!parsedQuery.success) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidRequest', event),
    })
  }

  return proxyExternalAssetBySource(event, type, parsedQuery.data.src)
}

export async function proxyExternalAssetByPublicPath(
  event: H3Event,
  type: ExternalAssetType,
  publicPath: string
) {
  return proxyExternalAssetBySource(
    event,
    type,
    resolveSourceFromPublicPath(event, type, publicPath)
  )
}

export async function proxyExternalAssetByPublicPathBase(
  event: H3Event,
  type: ExternalAssetType,
  publicPathBase: string
) {
  const pathname = getRequestURL(event).pathname
  const normalizedBase = publicPathBase.replace(/\/+$/, '')
  const prefix = `${normalizedBase}/`

  if (!pathname.startsWith(prefix)) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidPath', event),
    })
  }

  const publicPath = pathname.slice(prefix.length)
  if (!publicPath) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetPathRequired', event),
    })
  }

  try {
    return proxyExternalAssetByPublicPath(event, type, decodeURIComponent(publicPath))
  } catch (error) {
    if (error instanceof URIError) {
      throw createError({
        statusCode: 400,
        message: getPublicMessage('assetInvalidPath', event),
      })
    }

    throw error
  }
}
