import type { H3Event } from 'h3'
import { createError, getHeader, getMethod, getQuery, getRequestURL } from 'h3'
import { Agent, type Dispatcher } from 'undici'
import {
  getDefaultPublicApiErrorMessage,
  getPublicApiErrorMessage,
  type PublicApiErrorMessageKey,
} from './apiErrorMessages'
import {
  getRequiredExternalAssetBaseUrl,
  getRequiredExternalAssetProxyAllowedOrigins,
  getRequiredExternalAssetProxyImageMaxBytes,
  getRequiredExternalAssetProxyPdfMaxBytes,
  getRequiredExternalAssetProxyTimeoutMs,
  getRequiredSiteUrl,
} from './runtimeConfig'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from './externalApiCache'
import { logError } from './logger'
import { externalAssetPublicPathParamSchema, externalAssetQuerySchema } from './validation'
import { INTERNAL_ASSET_PROXY_PATH_BASES } from '~~/shared/constants/assetPaths'
import { setUrlSearchParam } from '~~/shared/utils/url'

export type ExternalAssetType = 'image' | 'pdf'

interface ExternalAssetProxyUrlOptions {
  event?: H3Event
  forceProxyRelative?: boolean
  publicPathBase?: string
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
const CACHE_CONTROL_FLOOR_SECONDS = 24 * 60 * 60
const EXTERNAL_ASSET_PROXY_CONNECTIONS = 8
const EXTERNAL_ASSET_PROXY_CONNECT_TIMEOUT_MS = 5_000
const EXTERNAL_ASSET_PROXY_HEADERS_TIMEOUT_MS = 30_000
const EXTERNAL_ASSET_PROXY_BODY_TIMEOUT_MS = 30_000
const EXTERNAL_ASSET_PROXY_KEEP_ALIVE_TIMEOUT_MS = 5_000
const EXTERNAL_ASSET_PROXY_KEEP_ALIVE_MAX_TIMEOUT_MS = 60_000
const EXTERNAL_ASSET_PROXY_MAX_ORIGINS = 16
const INTERNAL_ASSET_KIND_QUERY_PARAM = '__imgkind'

const externalAssetProxyDispatcher = new Agent({
  bodyTimeout: EXTERNAL_ASSET_PROXY_BODY_TIMEOUT_MS,
  connectTimeout: EXTERNAL_ASSET_PROXY_CONNECT_TIMEOUT_MS,
  connections: EXTERNAL_ASSET_PROXY_CONNECTIONS,
  headersTimeout: EXTERNAL_ASSET_PROXY_HEADERS_TIMEOUT_MS,
  keepAliveMaxTimeout: EXTERNAL_ASSET_PROXY_KEEP_ALIVE_MAX_TIMEOUT_MS,
  keepAliveTimeout: EXTERNAL_ASSET_PROXY_KEEP_ALIVE_TIMEOUT_MS,
  maxOrigins: EXTERNAL_ASSET_PROXY_MAX_ORIGINS,
  pipelining: 1,
})

interface ExternalAssetProxyRequestInit extends RequestInit {
  dispatcher?: Dispatcher
}

const PROXIED_PATH_PREFIXES = INTERNAL_ASSET_PROXY_PATH_BASES.map((path) => `${path}/`)

const getPublicMessage = (key: PublicApiErrorMessageKey, event?: H3Event) =>
  event ? getPublicApiErrorMessage(event, key) : getDefaultPublicApiErrorMessage(key)

interface CachedExternalAssetProxyConfig {
  allowedOrigins: Set<string>
  assetBaseOrigin: string | null
  assetBaseUrl: string
}

interface CachedExternalAssetProxyConfigState {
  expiresAt: number
  value: CachedExternalAssetProxyConfig
}

const EXTERNAL_ASSET_PROXY_CONFIG_TTL_MS = 60_000

let cachedExternalAssetProxyConfig: CachedExternalAssetProxyConfigState | null = null

export function invalidateExternalAssetProxyConfigCache() {
  cachedExternalAssetProxyConfig = null
}

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const parseAllowedOrigins = (value: string) => {
  const origins = new Set<string>()

  for (const token of value.split(',')) {
    const normalized = normalizeOrigin(token.trim())
    if (normalized) {
      origins.add(normalized)
    }
  }

  return origins
}

const getExternalAssetProxyConfig = (event?: H3Event) => {
  const now = Date.now()

  if (cachedExternalAssetProxyConfig && cachedExternalAssetProxyConfig.expiresAt > now) {
    return cachedExternalAssetProxyConfig.value
  }

  const assetBaseUrl = getRequiredExternalAssetBaseUrl(
    event,
    getPublicMessage('assetProxyNotConfigured', event)
  )
  const assetBaseOrigin = normalizeOrigin(assetBaseUrl)
  const allowedOrigins = parseAllowedOrigins(
    getRequiredExternalAssetProxyAllowedOrigins(
      event,
      getPublicMessage('assetProxyNotConfigured', event)
    )
  )

  if (assetBaseOrigin) {
    allowedOrigins.add(assetBaseOrigin)
  }

  const config = {
    allowedOrigins,
    assetBaseOrigin,
    assetBaseUrl,
  }

  cachedExternalAssetProxyConfig = {
    value: config,
    expiresAt: now + EXTERNAL_ASSET_PROXY_CONFIG_TTL_MS,
  }

  return config
}

const resolveSourceUrl = (src: string, baseUrl: string) => {
  try {
    return new URL(src)
  } catch {
    return new URL(src, baseUrl)
  }
}

const isAbsoluteHttpUrl = (value: string) => /^https?:\/\//i.test(value)
const isLocalPath = (value: string) => value.startsWith('/') && !value.startsWith('//')

const isAlreadyProxied = (value: string) => {
  if (PROXIED_PATH_PREFIXES.some((prefix) => value.startsWith(prefix))) {
    return true
  }

  if (!isAbsoluteHttpUrl(value)) {
    return false
  }

  try {
    const pathname = new URL(value).pathname
    return PROXIED_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  } catch {
    return false
  }
}

const isSpecialUrl = (value: string) => value.startsWith('data:') || value.startsWith('blob:')

const getDefaultAssetPathBase = (type: ExternalAssetType) =>
  type === 'image' ? '/imagenes/externas' : '/documentos/externos'

const getConfiguredBaseUrl = (event?: H3Event) => {
  return getExternalAssetProxyConfig(event).assetBaseUrl
}

const buildAssetPath = (pathBase: string, pathname: string, search = '') => {
  const base = pathBase.replace(/\/+$/, '')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalizedPath}${search}`
}

const getPublicSiteOrigin = () =>
  new URL(getRequiredSiteUrl(undefined, getPublicMessage('siteUrlNotConfigured'))).origin

const stripHash = (value: string) => {
  const hashIndex = value.indexOf('#')
  return hashIndex === -1 ? value : value.slice(0, hashIndex)
}

const stripInternalAssetHintParams = (search: string) => {
  if (!search) {
    return ''
  }

  const params = new URLSearchParams(search)
  params.delete(INTERNAL_ASSET_KIND_QUERY_PARAM)
  const normalized = params.toString()
  return normalized ? `?${normalized}` : ''
}

const buildSemanticAssetPath = (
  source: string,
  type: ExternalAssetType,
  options: ExternalAssetProxyUrlOptions = {}
) => {
  const configuredBaseUrl = getConfiguredBaseUrl(options.event)
  const pathBase = options.publicPathBase || getDefaultAssetPathBase(type)
  const { assetBaseOrigin } = getExternalAssetProxyConfig(options.event)

  if (isAbsoluteHttpUrl(source)) {
    const sourceUrl = new URL(source)
    sourceUrl.hash = ''
    const pathParts = { pathname: sourceUrl.pathname, search: sourceUrl.search }

    if (assetBaseOrigin === sourceUrl.origin) {
      return buildAssetPath(pathBase, pathParts.pathname, pathParts.search)
    }

    const protocol = sourceUrl.protocol.replace(/:$/, '')
    return buildAssetPath(
      pathBase,
      `/${protocol}/${sourceUrl.host}${pathParts.pathname}`,
      pathParts.search
    )
  }

  if (!configuredBaseUrl) {
    return null
  }

  const sourceUrl = resolveSourceUrl(stripHash(source), configuredBaseUrl)
  const pathParts = { pathname: sourceUrl.pathname, search: sourceUrl.search }

  return buildAssetPath(pathBase, pathParts.pathname, pathParts.search)
}

const resolveSourceFromPublicPath = (
  event: H3Event,
  type: ExternalAssetType,
  publicPath: string
) => {
  const parsedPath = externalAssetPublicPathParamSchema.safeParse({ path: publicPath })
  if (!parsedPath.success) {
    throw createError({
      statusCode: 400,
      message: getPublicMessage('assetInvalidPath', event),
    })
  }

  const normalizedPath = parsedPath.data.path.replace(/^\/+/, '')
  const segments = normalizedPath.split('/').filter(Boolean)
  const requestSearch = stripInternalAssetHintParams(getRequestURL(event).search)
  const pathParts = { pathname: `/${normalizedPath}`, search: '' }
  const search = requestSearch

  if ((segments[0] === 'http' || segments[0] === 'https') && segments.length >= 3) {
    const [protocol, host, ...rest] = segments
    const absolutePathParts = { pathname: `/${rest.join('/')}`, search: '' }

    return `${protocol}://${host}${absolutePathParts.pathname}${absolutePathParts.search || requestSearch}`
  }

  return `${pathParts.pathname}${search}`
}

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

  // Maximum number of redirects to follow before giving up
  const MAX_REDIRECTS = 5

  /**
   * Follow redirects manually so every hop's destination is validated against
   * the allowed-origins list before the request is made. This prevents SSRF
   * attacks where a trusted origin redirects to an internal host: with
   * `redirect: 'follow'` the internal host receives the connection and its
   * response is only rejected after the fact.
   */
  async function fetchWithSafeRedirects(url: string, hops = 0): Promise<Response> {
    if (hops > MAX_REDIRECTS) {
      throw createError({ statusCode: 502, message: getPublicMessage('assetUnavailable', event) })
    }

    const requestInit: ExternalAssetProxyRequestInit = {
      dispatcher: externalAssetProxyDispatcher,
      method: method === 'HEAD' ? 'HEAD' : 'GET',
      headers: requestHeaders,
      redirect: 'manual',
      signal: controller.signal,
    }
    const response = await fetch(url, requestInit)

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw createError({ statusCode: 502, message: getPublicMessage('assetUnavailable', event) })
      }

      let nextUrl: URL
      try {
        // location may be relative — resolve it against the current URL
        nextUrl = new URL(location, url)
      } catch {
        throw createError({
          statusCode: 400,
          message: getPublicMessage('assetInvalidOrigin', event),
        })
      }

      if (!['http:', 'https:'].includes(nextUrl.protocol)) {
        throw createError({
          statusCode: 400,
          message: getPublicMessage('assetInvalidProtocol', event),
        })
      }

      if (!allowedOrigins.has(nextUrl.origin)) {
        throw createError({
          statusCode: 400,
          message: getPublicMessage('assetInvalidOrigin', event),
        })
      }

      return fetchWithSafeRedirects(nextUrl.toString(), hops + 1)
    }

    return response
  }

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

    const upstreamResponse = await fetchWithSafeRedirects(sourceUrl.toString())

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

export const toExternalAssetProxyUrl = (
  src: string | null | undefined,
  type: ExternalAssetType,
  options: ExternalAssetProxyUrlOptions = {}
) => {
  if (!src) {
    return null
  }

  const normalized = src.trim()

  if (!normalized || isAlreadyProxied(normalized) || isSpecialUrl(normalized)) {
    return normalized || null
  }

  if (isLocalPath(normalized) && !options.forceProxyRelative) {
    return normalized
  }

  if (!isAbsoluteHttpUrl(normalized) && !options.forceProxyRelative) {
    return normalized
  }

  try {
    const assetPath = buildSemanticAssetPath(normalized, type, options)
    if (!assetPath) {
      return normalized
    }

    if (options.forceProxyRelative) {
      return assetPath
    }

    if (type === 'image') {
      const siteOrigin = getPublicSiteOrigin()
      if (siteOrigin) {
        return new URL(assetPath, siteOrigin).toString()
      }
    }

    return assetPath
  } catch {
    return normalized
  }
}

const getImageKindFromPathname = (pathname: string): 'svg' | 'raster' | null => {
  const normalizedPathname = pathname.toLowerCase()

  if (normalizedPathname.endsWith('.svg')) {
    return 'svg'
  }

  if (
    normalizedPathname.endsWith('.png') ||
    normalizedPathname.endsWith('.jpg') ||
    normalizedPathname.endsWith('.jpeg') ||
    normalizedPathname.endsWith('.webp') ||
    normalizedPathname.endsWith('.gif') ||
    normalizedPathname.endsWith('.avif')
  ) {
    return 'raster'
  }

  return null
}

const appendAssetKindHint = (url: string, kind: 'svg') => {
  try {
    return setUrlSearchParam(url, INTERNAL_ASSET_KIND_QUERY_PARAM, kind)
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${INTERNAL_ASSET_KIND_QUERY_PARAM}=${kind}`
  }
}

export async function isExternalImageSvg(source: string | null | undefined, event: H3Event) {
  const normalizedSource = source?.trim()
  if (!normalizedSource || isSpecialUrl(normalizedSource)) {
    return false
  }

  try {
    const { allowedOrigins, assetBaseUrl: configuredBaseUrl } = getExternalAssetProxyConfig(event)
    const sourceUrl = resolveSourceUrl(normalizedSource, configuredBaseUrl)
    const imageKindFromPathname = getImageKindFromPathname(sourceUrl.pathname)

    if (imageKindFromPathname) {
      return imageKindFromPathname === 'svg'
    }

    return await withExternalApiSWRCache(
      `external-asset-kind:image:${sourceUrl.toString()}`,
      async () => {
        if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
          return false
        }

        if (sourceUrl.username || sourceUrl.password || !allowedOrigins.has(sourceUrl.origin)) {
          return false
        }

        const timeoutMs = getRequiredExternalAssetProxyTimeoutMs(event)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        const requestHeaders = new Headers({ accept: getAssetAcceptHeader('image') })
        const methodCandidates: Array<'HEAD' | 'GET'> = ['HEAD', 'GET']

        const fetchWithSafeRedirects = async (
          url: string,
          method: 'HEAD' | 'GET',
          hops = 0
        ): Promise<Response> => {
          if (hops > 5) {
            throw new Error('Too many redirects')
          }

          const requestInit: ExternalAssetProxyRequestInit = {
            dispatcher: externalAssetProxyDispatcher,
            method,
            headers: requestHeaders,
            redirect: 'manual',
            signal: controller.signal,
          }
          const response = await fetch(url, requestInit)

          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location')
            if (!location) {
              throw new Error('Missing redirect location')
            }

            const nextUrl = new URL(location, url)
            if (
              !['http:', 'https:'].includes(nextUrl.protocol) ||
              !allowedOrigins.has(nextUrl.origin)
            ) {
              throw new Error('Redirect target not allowed')
            }

            return fetchWithSafeRedirects(nextUrl.toString(), method, hops + 1)
          }

          return response
        }

        try {
          for (const method of methodCandidates) {
            const response = await fetchWithSafeRedirects(sourceUrl.toString(), method)

            if ((response.status === 405 || response.status === 501) && method === 'HEAD') {
              continue
            }

            if (![200, 204, 206, 304].includes(response.status)) {
              return false
            }

            const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
            if (method === 'GET') {
              await response.body?.cancel()
            }

            if (contentType.includes('image/svg+xml')) {
              return true
            }

            if (contentType.startsWith('image/')) {
              return false
            }
          }

          return false
        } finally {
          clearTimeout(timeoutId)
        }
      },
      getExternalApiCacheOptions(event)
    )
  } catch (error) {
    logError('external-asset.kind-detection', error, { source: normalizedSource }, event)
    return false
  }
}

export async function toExternalImageProxyUrlWithKindHint(
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) {
  const resolvedUrl = toExternalImageProxyUrl(src, options)
  if (!resolvedUrl || !src || !options.event) {
    return resolvedUrl
  }

  return (await isExternalImageSvg(src, options.event))
    ? appendAssetKindHint(resolvedUrl, 'svg')
    : resolvedUrl
}

export const toExternalImageProxyUrl = (
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) => toExternalAssetProxyUrl(src, 'image', options)

export const toExternalPdfProxyUrl = (
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) => toExternalAssetProxyUrl(src, 'pdf', options)

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
