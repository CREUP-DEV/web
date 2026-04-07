import { defineEventHandler, createError, readMultipartFormData, getRequestHeader } from 'h3'
import { toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'
import { saveAdminDocument } from '../../../utils/adminDocumentUpload'
import { validateMultipartFile } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/prensa/dossier'
const UPLOAD_MAX_REQUEST_BYTES = 22 * 1024 * 1024 // 22 MB hard ceiling

export default defineEventHandler(async (event) => {
  const rawContentLength = Number(getRequestHeader(event, 'content-length') ?? NaN)
  if (!Number.isNaN(rawContentLength) && rawContentLength > UPLOAD_MAX_REQUEST_BYTES) {
    throw createError({ statusCode: 413, message: 'Solicitud demasiado grande' })
  }

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)

  const { storagePath } = await saveAdminDocument({
    data: Buffer.from(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: PRESS_DOSSIER_PUBLIC_PATH,
  })

  return {
    path:
      toExternalPdfProxyUrl(storagePath, {
        publicPathBase: PRESS_DOSSIER_PUBLIC_PATH,
      }) ?? storagePath,
    storagePath,
  }
})
