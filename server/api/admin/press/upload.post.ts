import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { requireAuth } from '../../../utils/requireAuth'
import { toExternalImageProxyUrl, toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'

const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
const ALLOWED_PDF_EXTENSIONS = ['.pdf']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 20 * 1024 * 1024 // 20MB
const IMAGE_UPLOAD_DIR = 'public/prensa/imagenes'
const PDF_UPLOAD_DIR = 'public/prensa/documentos'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, message: 'No se ha enviado ningún archivo' })
  }

  const file = formData.find((f) => f.name === 'file')
  if (!file || !file.data || !file.filename) {
    throw createError({ statusCode: 400, message: 'Archivo no válido' })
  }

  const ext = extname(file.filename).toLowerCase()
  const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext)
  const isPdf = ALLOWED_PDF_EXTENSIONS.includes(ext)

  if (!isImage && !isPdf) {
    throw createError({
      statusCode: 400,
      message: `Formato no permitido. Formatos admitidos: ${[...ALLOWED_IMAGE_EXTENSIONS, ...ALLOWED_PDF_EXTENSIONS].join(', ')}`,
    })
  }

  const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
  if (file.data.length > maxSize) {
    throw createError({
      statusCode: 400,
      message: `El archivo supera el tamaño máximo (${isPdf ? '20MB' : '5MB'})`,
    })
  }

  const uploadDir = isPdf ? PDF_UPLOAD_DIR : IMAGE_UPLOAD_DIR
  const publicPath = isPdf ? '/prensa/documentos' : '/prensa/imagenes'

  const filename = `${createId()}${ext}`
  const uploadPath = join(process.cwd(), uploadDir)

  await mkdir(uploadPath, { recursive: true })
  await writeFile(join(uploadPath, filename), file.data)

  const storagePath = `${publicPath}/${filename}`
  const path =
    (isPdf ? toExternalPdfProxyUrl(storagePath) : toExternalImageProxyUrl(storagePath)) ??
    storagePath

  return {
    path,
    storagePath,
    type: isPdf ? 'pdf' : 'image',
  }
})
