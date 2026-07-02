import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { extname } from 'node:path'
import { toExternalImageProxyUrl } from '../../../utils/external/externalAssetUrl'
import {
  ALLOWED_ADMIN_IMAGE_EXTENSIONS,
  saveAdminImage,
} from '../../../utils/admin/adminImageUpload'
import {
  assertUploadedFileSize,
  assertUploadRequestSize,
} from '../../../utils/core/uploadRequestLimit'
import { getMultipartFileBuffer, validateMultipartFile } from '../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const IMAGE_UPLOAD_DIR = 'public/transparencia/actividad/imagenes'
const UPLOAD_MAX_REQUEST_BYTES = 7 * 1024 * 1024 // 7 MB hard ceiling (above image limit)

export default defineEventHandler(async (event) => {
  await assertUploadRequestSize(
    event,
    UPLOAD_MAX_REQUEST_BYTES,
    getAdminApiErrorMessage(event, 'requestTooLarge')
  )

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(event, formData)
  const fileData = getMultipartFileBuffer(file.data)

  const ext = extname(file.filename).toLowerCase()
  const isImage = ALLOWED_ADMIN_IMAGE_EXTENSIONS.includes(
    ext as (typeof ALLOWED_ADMIN_IMAGE_EXTENSIONS)[number]
  )

  if (!isImage) {
    throw createError({
      statusCode: 400,
      message: getAdminApiErrorMessage(event, 'formatNotAllowed').replace(
        '{formats}',
        ALLOWED_ADMIN_IMAGE_EXTENSIONS.join(', ')
      ),
    })
  }

  assertUploadedFileSize(
    fileData.length,
    MAX_IMAGE_SIZE,
    getAdminApiErrorMessage(event, 'fileTooLargeMb').replace('{mb}', '5')
  )

  const { storagePath } = await saveAdminImage({
    event,
    data: fileData,
    filename: file.filename,
    uploadDir: IMAGE_UPLOAD_DIR,
    publicPath: ACTIVITY_IMAGE_PUBLIC_BASE,
    maxFileSizeBytes: MAX_IMAGE_SIZE,
    temporary: true,
  })

  const path =
    toExternalImageProxyUrl(storagePath, { publicPathBase: ACTIVITY_IMAGE_PUBLIC_BASE }) ??
    storagePath

  return { path, storagePath, type: 'image' as const }
})
