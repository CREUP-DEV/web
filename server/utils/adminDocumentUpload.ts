import { createError } from 'h3'
import { extname } from 'node:path'
import { finalizeAdminFile, saveTemporaryAdminFile } from './adminStoredFile'

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024

interface SaveAdminDocumentOptions {
  data: Buffer
  filename: string
  uploadDir: string
  publicPath: string
  allowedExtensions?: string[]
  maxFileSizeBytes?: number
}

interface FinalizeAdminDocumentOptions {
  storagePath: string
  uploadDir: string
  publicPath: string
  slug?: string
  fallbackBaseName?: string
  replaceStoragePath?: string | null
  publish?: boolean
  protectedPublicPaths?: string[]
}

export async function saveAdminDocument(options: SaveAdminDocumentOptions) {
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE
  const allowedExtensions = options.allowedExtensions ?? ['.pdf']

  if (options.data.length > maxFileSizeBytes) {
    throw createError({
      statusCode: 400,
      message: `El archivo supera el tamaño máximo (${Math.round(maxFileSizeBytes / 1024 / 1024)}MB)`,
    })
  }

  const extension = extname(options.filename).toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    throw createError({
      statusCode: 400,
      message: `Formato no permitido. Formatos admitidos: ${allowedExtensions.join(', ')}`,
    })
  }

  return saveTemporaryAdminFile({
    data: options.data,
    extension,
  })
}

export function finalizeAdminDocument(options: FinalizeAdminDocumentOptions) {
  return finalizeAdminFile({
    ...options,
    fallbackBaseName: options.fallbackBaseName ?? 'documento',
  })
}
