import type { H3Event } from 'h3'
import { createError, getHeader, getMethod, getQuery, getRequestURL } from 'h3'
import {
  getRequiredExternalApiBaseUrl,
  getRequiredExternalAssetProxyAllowedOrigins,
  getRequiredExternalAssetProxyImageMaxBytes,
  getRequiredExternalAssetProxyPdfMaxBytes,
  getRequiredExternalAssetProxyTimeoutMs,
  getRequiredSiteUrl,
} from './runtimeConfig'
import { logError } from './logger'
import { getRequestLocaleContext } from './requestLocale'
import { externalAssetPublicPathParamSchema, externalAssetQuerySchema } from './validation'
import { INTERNAL_ASSET_PROXY_PATH_BASES } from '~~/shared/constants/assetPaths'
import { pickLocalizedValue } from '~~/shared/utils/locale'

export type ExternalAssetType = 'image' | 'pdf'

interface ExternalAssetProxyUrlOptions {
  event?: H3Event
  forceProxyRelative?: boolean
  publicPathBase?: string
}

const DEFAULT_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

const PROXIED_PATH_PREFIXES = INTERNAL_ASSET_PROXY_PATH_BASES.map((path) => `${path}/`)

const messagesByLocale = {
  en: {
    invalidPath: 'Invalid asset path.',
    methodNotAllowed: 'Method not allowed.',
    proxyNotConfigured: 'External asset proxy is not configured.',
    invalidProtocol: 'Invalid asset protocol.',
    invalidCredentials: 'Invalid asset URL credentials.',
    invalidOrigin: 'Invalid asset origin.',
    notFound: 'External asset not found.',
    unavailable: 'External asset is temporarily unavailable.',
    unsupportedType: 'Unsupported external asset type.',
    tooLarge: 'External asset exceeds size limit.',
    timedOut: 'External asset request timed out.',
    invalidRequest: 'Invalid asset request.',
    pathRequired: 'Asset path is required.',
    siteUrlNotConfigured: 'Site URL is not configured.',
  },
  es: {
    invalidPath: 'La ruta del recurso no es válida.',
    methodNotAllowed: 'Método no permitido.',
    proxyNotConfigured: 'El proxy de recursos externos no está configurado.',
    invalidProtocol: 'El protocolo del recurso no es válido.',
    invalidCredentials: 'La URL del recurso no puede incluir credenciales.',
    invalidOrigin: 'El origen del recurso no es válido.',
    notFound: 'Recurso externo no encontrado.',
    unavailable: 'El recurso externo no está disponible temporalmente.',
    unsupportedType: 'El tipo de recurso externo no es compatible.',
    tooLarge: 'El recurso externo supera el tamaño máximo permitido.',
    timedOut: 'La solicitud del recurso externo ha superado el tiempo de espera.',
    invalidRequest: 'La solicitud del recurso no es válida.',
    pathRequired: 'La ruta del recurso es obligatoria.',
    siteUrlNotConfigured: 'La URL pública del sitio no está configurada.',
  },
}

const getMessages = (event?: H3Event) => {
  if (!event) {
    return messagesByLocale.es
  }

  const { locale, fallbackLocale } = getRequestLocaleContext(event)
  return pickLocalizedValue(messagesByLocale, locale, fallbackLocale) ?? messagesByLocale.es
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
  return getRequiredExternalApiBaseUrl(event, getMessages(event).proxyNotConfigured)
}

const buildAssetPath = (pathBase: string, pathname: string, search = '') => {
  const base = pathBase.replace(/\/+$/, '')
  const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`
  return `${base}${normalizedPath}${search}`
}

const getPublicSiteOrigin = (event?: H3Event) => {
  if (event) {
    return getRequestURL(event).origin
  }

  return new URL(getRequiredSiteUrl(undefined, getMessages(undefined).siteUrlNotConfigured)).origin
}

const stripHash = (value: string) => {
  const hashIndex = value.indexOf('#')
  return hashIndex === -1 ? value : value.slice(0, hashIndex)
}

const buildSemanticAssetPath = (
  source: string,
  type: ExternalAssetType,
  options: ExternalAssetProxyUrlOptions = {}
) => {
  const configuredBaseUrl = getConfiguredBaseUrl(options.event)
  const pathBase = options.publicPathBase || getDefaultAssetPathBase(type)

  if (isAbsoluteHttpUrl(source)) {
    const sourceUrl = new URL(source)
    sourceUrl.hash = ''
    const pathParts = { pathname: sourceUrl.pathname, search: sourceUrl.search }

    if (configuredBaseUrl && normalizeOrigin(configuredBaseUrl) === sourceUrl.origin) {
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
  const messages = getMessages(event)
  const parsedPath = externalAssetPublicPathParamSchema.safeParse({ path: publicPath })
  if (!parsedPath.success) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidPath,
    })
  }

  const normalizedPath = parsedPath.data.path.replace(/^\/+/, '')
  const segments = normalizedPath.split('/').filter(Boolean)
  const requestSearch = getRequestURL(event).search
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

const buildOutgoingHeaders = (
  upstreamResponse: Response,
  type: ExternalAssetType,
  method: string
) => {
  const headers = new Headers()

  const cacheControl = upstreamResponse.headers.get('cache-control') || DEFAULT_CACHE_CONTROL
  headers.set('cache-control', cacheControl)
  headers.set('x-content-type-options', 'nosniff')

  const contentType = upstreamResponse.headers.get('content-type')
  if (contentType) {
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

  const contentDisposition = upstreamResponse.headers.get('content-disposition')
  if (contentDisposition) {
    headers.set('content-disposition', contentDisposition)
  }

  return headers
}

export const proxyExternalAssetBySource = async (
  event: H3Event,
  type: ExternalAssetType,
  source: string
) => {
  const messages = getMessages(event)
  const method = getMethod(event).toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') {
    throw createError({
      statusCode: 405,
      statusMessage: messages.methodNotAllowed,
    })
  }

  const normalizedSource = source.trim()
  const configuredBaseUrl = getConfiguredBaseUrl(event)
  const configuredBaseOrigin = normalizeOrigin(configuredBaseUrl)
  const allowedOrigins = parseAllowedOrigins(getRequiredExternalAssetProxyAllowedOrigins(event))
  if (configuredBaseOrigin) {
    allowedOrigins.add(configuredBaseOrigin)
  }

  if (allowedOrigins.size === 0) {
    throw createError({
      statusCode: 500,
      statusMessage: messages.proxyNotConfigured,
    })
  }

  const sourceUrl = resolveSourceUrl(normalizedSource, configuredBaseUrl)

  if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidProtocol,
    })
  }

  if (sourceUrl.username || sourceUrl.password) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidCredentials,
    })
  }

  if (!allowedOrigins.has(sourceUrl.origin)) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidOrigin,
    })
  }

  const timeoutMs = getRequiredExternalAssetProxyTimeoutMs(event)
  const maxBytes = getMaxBytesForType(event, type)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const requestHeaders = new Headers()
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

    const upstreamResponse = await fetch(sourceUrl.toString(), {
      method: method === 'HEAD' ? 'HEAD' : 'GET',
      headers: requestHeaders,
      redirect: 'follow',
      signal: controller.signal,
    })

    if (upstreamResponse.status === 404) {
      throw createError({
        statusCode: 404,
        statusMessage: messages.notFound,
      })
    }

    if (![200, 206, 304].includes(upstreamResponse.status)) {
      throw createError({
        statusCode: 502,
        statusMessage: messages.unavailable,
      })
    }

    if (upstreamResponse.status !== 304) {
      const contentType = upstreamResponse.headers.get('content-type') ?? ''
      if (!isValidAssetContentType(type, contentType, sourceUrl.pathname)) {
        throw createError({
          statusCode: 415,
          statusMessage: messages.unsupportedType,
        })
      }

      const contentLength = Number(upstreamResponse.headers.get('content-length') ?? '')
      if (Number.isFinite(contentLength) && contentLength > maxBytes) {
        throw createError({
          statusCode: 413,
          statusMessage: messages.tooLarge,
        })
      }
    }

    const headers = buildOutgoingHeaders(upstreamResponse, type, method)
    const body =
      method === 'HEAD' || upstreamResponse.status === 304 ? null : (upstreamResponse.body ?? null)

    return new Response(body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw createError({
        statusCode: 504,
        statusMessage: messages.timedOut,
      })
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logError('external-asset.proxy', error, { source: normalizedSource, type }, event)
    throw createError({
      statusCode: 502,
      statusMessage: messages.unavailable,
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

  const assetPath = buildSemanticAssetPath(normalized, type, options)
  if (!assetPath) {
    return null
  }

  if (options.forceProxyRelative) {
    return assetPath
  }

  if (type === 'image') {
    const siteOrigin = getPublicSiteOrigin(options.event)
    if (siteOrigin) {
      return new URL(assetPath, siteOrigin).toString()
    }
  }

  return assetPath
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
  const messages = getMessages(event)
  const parsedQuery = externalAssetQuerySchema.safeParse(getQuery(event))
  if (!parsedQuery.success) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidRequest,
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
  const messages = getMessages(event)
  const pathname = getRequestURL(event).pathname
  const normalizedBase = publicPathBase.replace(/\/+$/, '')
  const prefix = `${normalizedBase}/`

  if (!pathname.startsWith(prefix)) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.invalidPath,
    })
  }

  const publicPath = pathname.slice(prefix.length)
  if (!publicPath) {
    throw createError({
      statusCode: 400,
      statusMessage: messages.pathRequired,
    })
  }

  try {
    return proxyExternalAssetByPublicPath(event, type, decodeURIComponent(publicPath))
  } catch (error) {
    if (error instanceof URIError) {
      throw createError({
        statusCode: 400,
        statusMessage: messages.invalidPath,
      })
    }

    throw error
  }
}
