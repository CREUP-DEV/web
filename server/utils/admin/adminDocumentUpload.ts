import { createError, type H3Event } from 'h3'
import { extname } from 'node:path'
import { finalizeAdminFile, saveTemporaryAdminFile } from './adminStoredFile'
import { resolveAdminApiMessage } from '../locale/adminApiErrorMessages'

const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024
const PDF_MAGIC_BYTES = '%PDF-'

function isProbablyPdf(data: Buffer) {
  if (data.length < PDF_MAGIC_BYTES.length) {
    return false
  }

  const header = data.subarray(0, 1024).toString('latin1')
  if (!header.startsWith(PDF_MAGIC_BYTES)) {
    return false
  }

  const trailer = data.subarray(Math.max(0, data.length - 2048)).toString('latin1')
  return trailer.includes('startxref') && trailer.includes('%%EOF')
}

interface SaveAdminDocumentOptions {
  data: Buffer
  filename: string
  uploadDir: string
  publicPath: string
  allowedExtensions?: string[]
  maxFileSizeBytes?: number
  /** Request event for locale-aware error messages; falls back to es when omitted. */
  event?: H3Event
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
      message: resolveAdminApiMessage('fileTooLargeMb', options.event).replace(
        '{mb}',
        String(Math.round(maxFileSizeBytes / 1024 / 1024))
      ),
    })
  }

  const extension = extname(options.filename).toLowerCase()
  if (!allowedExtensions.includes(extension)) {
    throw createError({
      statusCode: 400,
      message: resolveAdminApiMessage('formatNotAllowed', options.event).replace(
        '{formats}',
        allowedExtensions.join(', ')
      ),
    })
  }

  if (extension === '.pdf' && !isProbablyPdf(options.data)) {
    throw createError({
      statusCode: 400,
      message: resolveAdminApiMessage('pdfInvalid', options.event),
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
