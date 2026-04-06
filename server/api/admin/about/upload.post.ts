import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalImageProxyUrl } from '../../../utils/externalAssetProxy'
import { saveAdminImage } from '../../../utils/adminImageUpload'
import { validateMultipartFile } from '../../../utils/validation'
import { ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/conocenos/imagenes'

export default defineEventHandler(async (event) => {
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
