import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { access, writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { requireAuth } from '../../../utils/requireAuth'
import { toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'
import { buildReadableFileSlug, buildReadableFileSlugWithFallback } from '../../../utils/slug'

const ALLOWED_EXTENSIONS = ['.pdf']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const UPLOAD_DIR = 'public/documentos/informes-economicos'

async function fileExists(path: string) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

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

  const titleField = formData.find((f) => f.name === 'title')
  const approvedAtField = formData.find((f) => f.name === 'approvedAt')

  const title = titleField?.data ? Buffer.from(titleField.data).toString('utf8').trim() : ''
  const approvedAt = approvedAtField?.data
    ? Buffer.from(approvedAtField.data).toString('utf8').trim()
    : ''

  const ext = extname(file.filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw createError({
      statusCode: 400,
      message: 'Formato no permitido. Solo se admiten archivos PDF.',
    })
  }

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({
      statusCode: 400,
      message: 'El archivo supera el tamaño máximo (20MB)',
    })
  }

  const uploadPath = join(process.cwd(), UPLOAD_DIR)
  const originalName = file.filename.replace(/\.[^.]+$/, '')
  const baseTitle = title || originalName

  let readableBaseName = buildReadableFileSlug(baseTitle)
  let filename = `${readableBaseName}${ext}`
  let targetPath = join(uploadPath, filename)

  if (await fileExists(targetPath)) {
    readableBaseName = buildReadableFileSlugWithFallback(baseTitle, approvedAt || null)
    filename = `${readableBaseName}${ext}`
    targetPath = join(uploadPath, filename)
  }

  if (await fileExists(targetPath)) {
    readableBaseName = buildReadableFileSlugWithFallback(
      baseTitle,
      approvedAt || null,
      createId().slice(0, 6)
    )
    filename = `${readableBaseName}${ext}`
    targetPath = join(uploadPath, filename)
  }

  await mkdir(uploadPath, { recursive: true })
  await writeFile(targetPath, file.data)

  const storagePath = `/documentos/informes-economicos/${filename}`
  const path = toExternalPdfProxyUrl(storagePath) ?? storagePath

  return {
    path,
    storagePath,
  }
})
