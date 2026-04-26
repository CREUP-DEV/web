import type { H3Event } from 'h3'
import { createError, getRequestURL } from 'h3'
import { getRequiredSiteUrl } from '../core/runtimeConfig'
import { externalAssetPublicPathParamSchema } from '../validation'
import { INTERNAL_ASSET_PROXY_PATH_BASES } from '~~/shared/constants/assetPaths'
import { setUrlSearchParam } from '~~/shared/utils/url'
import {
  getExternalAssetProxyConfig,
  getPublicMessage,
  type ExternalAssetProxyUrlOptions,
  type ExternalAssetType,
} from './externalAssetProxyConfig'

const INTERNAL_ASSET_KIND_QUERY_PARAM = '__imgkind'
const PROXIED_PATH_PREFIXES = INTERNAL_ASSET_PROXY_PATH_BASES.map((path) => `${path}/`)

export const resolveSourceUrl = (src: string, baseUrl: string) => {
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

export const isSpecialUrl = (value: string) =>
  value.startsWith('data:') || value.startsWith('blob:')

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

export const resolveSourceFromPublicPath = (
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

export const toExternalImageProxyUrl = (
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) => toExternalAssetProxyUrl(src, 'image', options)

export const toExternalPdfProxyUrl = (
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) => toExternalAssetProxyUrl(src, 'pdf', options)

export const getImageKindFromPathname = (pathname: string): 'svg' | 'raster' | null => {
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

export const appendAssetKindHint = (url: string, kind: 'svg') => {
  try {
    return setUrlSearchParam(url, INTERNAL_ASSET_KIND_QUERY_PARAM, kind)
  } catch {
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}${INTERNAL_ASSET_KIND_QUERY_PARAM}=${kind}`
  }
}
