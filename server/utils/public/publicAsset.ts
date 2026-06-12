import { createError, defineEventHandler, getMethod, getRequestURL, setHeader } from 'h3'
import type { H3Event } from 'h3'
import { readFile, stat } from 'node:fs/promises'
import { extname, posix, resolve, sep } from 'node:path'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { logError } from '../core/logger'
import { throwMethodNotAllowed } from '../core/throwMethodNotAllowed'
import { externalAssetPublicPathParamSchema } from '../validation/external'
import { proxyExternalAssetByPublicPathBase } from '../external/externalAssetProxy'
import type { ExternalAssetType } from '../external/externalAssetProxyConfig'

const PUBLIC_ASSET_CACHE_CONTROL =
  'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'
const VERSIONED_PUBLIC_ASSET_CACHE_CONTROL = 'public, max-age=31536000, immutable'

const contentTypeByExtension: Record<string, string> = {
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

function normalizePublicAssetPath(publicPath: string) {
  const trimmedPublicPath = publicPath.trim()

  if (!trimmedPublicPath) {
    return ''
  }

  const normalizedPublicPath = posix.normalize(trimmedPublicPath)

  return normalizedPublicPath.startsWith('/') ? normalizedPublicPath : `/${normalizedPublicPath}`
}

function resolvePublicAssetAbsolutePath(publicPath: string) {
  const normalizedPublicPath = normalizePublicAssetPath(publicPath)
  const publicRoot = resolve(process.cwd(), 'public')
  const absolutePath = resolve(publicRoot, `.${normalizedPublicPath}`)

  if (absolutePath !== publicRoot && !absolutePath.startsWith(`${publicRoot}${sep}`)) {
    throw createError({
      statusCode: 404,
      message: 'Archivo no encontrado',
    })
  }

  return absolutePath
}

export function throwPublicAssetNotFound(): never {
  throw createError({
    statusCode: 404,
    message: 'Archivo no encontrado',
  })
}

function setPublicAssetHeaders(event: H3Event, publicPath: string, fileSize: number, mtime: Date) {
  const extension = extname(publicPath).toLowerCase()
  const contentType = contentTypeByExtension[extension] ?? 'application/octet-stream'
  const hasVersionParam = getRequestURL(event).searchParams.has('v')

  setHeader(
    event,
    'cache-control',
    hasVersionParam ? VERSIONED_PUBLIC_ASSET_CACHE_CONTROL : PUBLIC_ASSET_CACHE_CONTROL
  )
  setHeader(event, 'content-length', fileSize)
  setHeader(event, 'content-type', contentType)
  setHeader(event, 'last-modified', mtime.toUTCString())
  setHeader(event, 'x-content-type-options', 'nosniff')

  if (extension === '.pdf') {
    setHeader(event, 'content-disposition', 'inline')
  }
}

export async function tryServePublicAssetByPath(event: H3Event, publicPath: string) {
  const method = getMethod(event).toUpperCase()

  if (method !== 'GET' && method !== 'HEAD') {
    throwMethodNotAllowed()
  }

  const normalizedPublicPath = normalizePublicAssetPath(publicPath)
  const absolutePath = resolvePublicAssetAbsolutePath(normalizedPublicPath)

  try {
    const metadata = await stat(absolutePath)

    if (!metadata.isFile()) {
      return null
    }

    setPublicAssetHeaders(event, normalizedPublicPath, metadata.size, metadata.mtime)

    if (method === 'HEAD') {
      return new Response(null, { status: 200 })
    }

    return await readFile(absolutePath)
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return null
    }

    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    logError(
      'public-assets.read-unexpected-error',
      error,
      { publicPath: normalizedPublicPath },
      event
    )
    throw createError({
      statusCode: 500,
      message: getPublicApiErrorMessage(event, 'serviceTemporarilyUnavailable'),
    })
  }
}

export async function tryServePublicAssetByPathBase(event: H3Event, publicPathBase: string) {
  const pathname = getRequestURL(event).pathname
  const normalizedBase = publicPathBase.replace(/\/+$/, '')
  const prefix = `${normalizedBase}/`

  if (!pathname.startsWith(prefix)) {
    throw createError({
      statusCode: 404,
      message: 'Archivo no encontrado',
    })
  }

  const rawPublicPath = pathname.slice(prefix.length)
  let decodedPublicPath = ''

  try {
    decodedPublicPath = decodeURIComponent(rawPublicPath)
  } catch {
    throwPublicAssetNotFound()
  }

  const parsedPath = externalAssetPublicPathParamSchema.safeParse({
    path: decodedPublicPath,
  })

  if (!parsedPath.success) {
    throwPublicAssetNotFound()
  }

  const publicPath = parsedPath.data.path

  return tryServePublicAssetByPath(event, `${normalizedBase}/${publicPath}`)
}

interface PublicAssetRouteConfig {
  /** Public path prefix this route serves, e.g. ABOUT_IMAGE_PUBLIC_PATH. */
  pathBase: string
  /**
   * External-proxy behavior when the local file is absent:
   * - omitted → local-only; a miss is a 404 (`throwPublicAssetNotFound`).
   * - `{ kind }` → after a local miss, proxy the external asset (its own errors propagate).
   * - `{ kind, serveLocalFirst: false }` → never look locally; always proxy.
   * - `{ kind, notFoundOnExternal404: true }` → after a local miss, proxy but map an
   *   external 404 to the local 404 helper.
   */
  external?: {
    kind: ExternalAssetType
    serveLocalFirst?: boolean
    notFoundOnExternal404?: boolean
  }
}

/**
 * Build a Nitro route handler that serves a public asset prefix, collapsing the
 * local-only / local-then-external / external-only / external-with-404-fallback
 * copies that were duplicated across the `server/routes/**` asset routes.
 */
export function createPublicAssetRouteHandler(config: PublicAssetRouteConfig) {
  const { pathBase, external } = config

  return defineEventHandler(async (event) => {
    if (external && external.serveLocalFirst === false) {
      return proxyExternalAssetByPublicPathBase(event, external.kind, pathBase)
    }

    const localAsset = await tryServePublicAssetByPathBase(event, pathBase)

    if (localAsset) {
      return localAsset
    }

    if (!external) {
      throwPublicAssetNotFound()
    }

    if (!external.notFoundOnExternal404) {
      return proxyExternalAssetByPublicPathBase(event, external.kind, pathBase)
    }

    try {
      return await proxyExternalAssetByPublicPathBase(event, external.kind, pathBase)
    } catch (error) {
      if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
        throwPublicAssetNotFound()
      }

      throw error
    }
  })
}
