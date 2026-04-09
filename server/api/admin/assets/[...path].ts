import { createError, defineEventHandler, getMethod, setHeader } from 'h3'
import { readFile, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import {
  ADMIN_ASSET_ROUTE_BASE,
  isInternalAdminStoragePath,
  resolveAdminStoredAbsolutePath,
} from '../../../utils/adminStoredFile'
import { adminAssetPathRouteParamSchema, validateRouteParams } from '../../../utils/validation'

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

export default defineEventHandler(async (event) => {
  const method = getMethod(event).toUpperCase()

  if (method !== 'GET' && method !== 'HEAD') {
    throw createError({ statusCode: 405, message: 'Método no permitido' })
  }

  const { path } = validateRouteParams(event, adminAssetPathRouteParamSchema)

  const storagePath = `${ADMIN_ASSET_ROUTE_BASE}/${path}`

  if (!isInternalAdminStoragePath(storagePath)) {
    throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
  }

  const absolutePath = resolveAdminStoredAbsolutePath(storagePath)

  try {
    const metadata = await stat(absolutePath)

    if (!metadata.isFile()) {
      throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
    }

    const extension = extname(absolutePath).toLowerCase()
    const contentType = contentTypeByExtension[extension] ?? 'application/octet-stream'

    setHeader(event, 'cache-control', 'private, no-store')
    setHeader(event, 'content-length', metadata.size)
    setHeader(event, 'content-type', contentType)
    setHeader(event, 'x-content-type-options', 'nosniff')
    setHeader(event, 'content-disposition', extension === '.pdf' ? 'attachment' : 'inline')

    if (method === 'HEAD') {
      return null
    }

    return await readFile(absolutePath)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      throw createError({ statusCode: 404, message: 'Archivo no encontrado' })
    }

    throw error
  }
})
