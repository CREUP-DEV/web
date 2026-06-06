import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalImageProxyUrl } from '../../../utils/external/externalAssetUrl'
import { saveAdminImage } from '../../../utils/admin/adminImageUpload'
import { assertUploadRequestSize } from '../../../utils/core/uploadRequestLimit'
import { getMultipartFileBuffer, validateMultipartFile } from '../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  PRESS_IMAGE_PUBLIC_BASE,
  PRESS_MEDIA_LOGO_PUBLIC_PATH,
} from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/prensa/imagenes/medios'
const UPLOAD_MAX_REQUEST_BYTES = 6 * 1024 * 1024 // 6 MB hard ceiling (above image limit)

export default defineEventHandler(async (event) => {
  await assertUploadRequestSize(
    event,
    UPLOAD_MAX_REQUEST_BYTES,
    getAdminApiErrorMessage(event, 'requestTooLarge')
  )

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(event, formData)

  const { storagePath } = await saveAdminImage({
    event,
    data: getMultipartFileBuffer(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
    temporary: true,
  })

  return {
    path:
      toExternalImageProxyUrl(storagePath, {
        publicPathBase: PRESS_IMAGE_PUBLIC_BASE,
      }) ?? storagePath,
    storagePath,
  }
})
