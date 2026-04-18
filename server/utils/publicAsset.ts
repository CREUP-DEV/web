import { createError, getMethod, getRequestURL, setHeader } from 'h3'
import type { H3Event } from 'h3'
import { readFile, stat } from 'node:fs/promises'
import { extname, posix, resolve, sep } from 'node:path'
import { getPublicApiErrorMessage } from './apiErrorMessages'
import { logError } from './logger'
import { throwMethodNotAllowed } from './throwMethodNotAllowed'
import { externalAssetPublicPathParamSchema } from './validation/external'

const PUBLIC_ASSET_CACHE_CONTROL =
  'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800'

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

export function throwPublicAssetNotFound() {
  throw createError({
    statusCode: 404,
    message: 'Archivo no encontrado',
  })
}

function setPublicAssetHeaders(event: H3Event, publicPath: string, fileSize: number, mtime: Date) {
  const extension = extname(publicPath).toLowerCase()
  const contentType = contentTypeByExtension[extension] ?? 'application/octet-stream'

  setHeader(event, 'cache-control', PUBLIC_ASSET_CACHE_CONTROL)
  setHeader(event, 'content-length', fileSize)
  setHeader(event, 'content-type', contentType)
  setHeader(event, 'last-modified', mtime.toUTCString())
  setHeader(event, 'x-content-type-options', 'nosniff')

  if (extension === '.pdf') {
    setHeader(event, 'content-disposition', 'attachment')
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

  return tryServePublicAssetByPath(event, `${normalizedBase}/${parsedPath.data.path}`)
}
