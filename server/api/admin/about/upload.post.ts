import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalImageProxyUrl } from '../../../utils/externalAssetProxy'
import { saveAdminImage } from '../../../utils/adminImageUpload'
import { assertUploadRequestSize } from '../../../utils/uploadRequestLimit'
import { validateMultipartFile } from '../../../utils/validation'
import { ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/conocenos/imagenes'
const UPLOAD_MAX_REQUEST_BYTES = 6 * 1024 * 1024 // 6 MB hard ceiling (above image limit)

export default defineEventHandler(async (event) => {
  assertUploadRequestSize(event, UPLOAD_MAX_REQUEST_BYTES, 'Solicitud demasiado grande')

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)

  const { storagePath } = await saveAdminImage({
    data: Buffer.from(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: ABOUT_IMAGE_PUBLIC_PATH,
    temporary: true,
  })

  return {
    path:
      toExternalImageProxyUrl(storagePath, {
        publicPathBase: ABOUT_IMAGE_PUBLIC_PATH,
      }) ?? storagePath,
    storagePath,
  }
})
