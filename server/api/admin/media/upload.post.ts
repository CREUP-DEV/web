import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { createId } from '@paralleldrive/cuid2'
import { requireAuth } from '../../../utils/requireAuth'

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const UPLOAD_DIR = 'public/img/media'

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

  if (file.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: 'El archivo supera el tamaño máximo (5MB)' })
  }

  const ext = extname(file.filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw createError({
      statusCode: 400,
      message: `Formato no permitido. Formatos admitidos: ${ALLOWED_EXTENSIONS.join(', ')}`,
    })
  }

  const filename = `${createId()}${ext}`
  const uploadPath = join(process.cwd(), UPLOAD_DIR)

  await mkdir(uploadPath, { recursive: true })
  await writeFile(join(uploadPath, filename), file.data)

  return { path: `/img/media/${filename}` }
})
