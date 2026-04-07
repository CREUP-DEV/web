import { defineEventHandler, createError, readMultipartFormData, getRequestHeader } from 'h3'
import { extname } from 'node:path'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'
import { ALLOWED_ADMIN_IMAGE_EXTENSIONS, saveAdminImage } from '../../../utils/adminImageUpload'
import { saveAdminDocument } from '../../../utils/adminDocumentUpload'
import { validateMultipartFile } from '../../../utils/validation'
import {
  NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
  NEWSLETTER_DOCUMENT_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

const ALLOWED_PDF_EXTENSIONS = ['.pdf']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB
const IMAGE_UPLOAD_DIR = 'public/prensa/newsletter/portadas'
const PDF_UPLOAD_DIR = 'public/prensa/newsletter/documentos'

const UPLOAD_MAX_REQUEST_BYTES = 22 * 1024 * 1024 // 22 MB hard ceiling (above PDF limit)

export default defineEventHandler(async (event) => {
  const rawContentLength = Number(getRequestHeader(event, 'content-length') ?? NaN)
  if (!Number.isNaN(rawContentLength) && rawContentLength > UPLOAD_MAX_REQUEST_BYTES) {
    throw createError({ statusCode: 413, message: 'Solicitud demasiado grande' })
  }

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)
  const fileData = Buffer.from(file.data)

  const ext = extname(file.filename).toLowerCase()
  const isImage = ALLOWED_ADMIN_IMAGE_EXTENSIONS.includes(
    ext as (typeof ALLOWED_ADMIN_IMAGE_EXTENSIONS)[number]
  )
  const isPdf = ALLOWED_PDF_EXTENSIONS.includes(ext)

  if (!isImage && !isPdf) {
    throw createError({
      statusCode: 400,
      message: `Formato no permitido. Formatos admitidos: ${[...ALLOWED_ADMIN_IMAGE_EXTENSIONS, ...ALLOWED_PDF_EXTENSIONS].join(', ')}`,
    })
  }

  const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
  if (fileData.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: `El archivo supera el tamaño máximo (${isPdf ? '20MB' : '5MB'})`,
    })
  }

  let storagePath: string

  if (isPdf) {
    storagePath = (
      await saveAdminDocument({
        data: fileData,
        filename: file.filename,
        uploadDir: PDF_UPLOAD_DIR,
        publicPath: NEWSLETTER_DOCUMENT_PUBLIC_PATH,
        allowedExtensions: ALLOWED_PDF_EXTENSIONS,
        maxFileSizeBytes: MAX_PDF_SIZE,
      })
    ).storagePath
  } else {
    storagePath = (
      await saveAdminImage({
        data: fileData,
        filename: file.filename,
        uploadDir: IMAGE_UPLOAD_DIR,
        publicPath: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH,
        maxFileSizeBytes: MAX_IMAGE_SIZE,
        temporary: true,
      })
    ).storagePath
  }

  const path =
    (isPdf ? toExternalPdfProxyUrl(storagePath) : toExternalImageProxyUrl(storagePath)) ??
    storagePath

  return {
    path,
    storagePath,
    type: isPdf ? 'pdf' : 'image',
  }
})
