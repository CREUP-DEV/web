import { defineEventHandler, readMultipartFormData } from 'h3'
import { saveAdminImage } from '../../../utils/adminImageUpload'
import { toExternalImageProxyUrl } from '../../../utils/externalAssetProxy'
import { assertUploadRequestSize } from '../../../utils/uploadRequestLimit'
import {
  adminUploadKindSchema,
  getMultipartTextField,
  validateInput,
  validateMultipartFile,
} from '../../../utils/validation'
import {
  HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
  HOME_IMAGE_PUBLIC_BASE,
} from '~~/shared/constants/assetPaths'

const uploadTargets = {
  carousel: {
    uploadDir: 'public/inicio/imagenes/carrusel',
    publicPath: HOME_CAROUSEL_IMAGE_PUBLIC_PATH,
  },
  featured_link: {
    uploadDir: 'public/inicio/imagenes/enlaces-destacados',
    publicPath: HOME_FEATURED_LINK_IMAGE_PUBLIC_PATH,
  },
} as const
const UPLOAD_MAX_REQUEST_BYTES = 6 * 1024 * 1024 // 6 MB hard ceiling (above image limit)

export default defineEventHandler(async (event) => {
  assertUploadRequestSize(event, UPLOAD_MAX_REQUEST_BYTES, 'Solicitud demasiado grande')

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)

  const { kind } = validateInput(adminUploadKindSchema, {
    kind: getMultipartTextField(formData, 'kind'),
  })

  const target = uploadTargets[kind]
  const { storagePath } = await saveAdminImage({
    data: Buffer.from(file.data),
    filename: file.filename,
    uploadDir: target.uploadDir,
    publicPath: target.publicPath,
    temporary: true,
  })

  return {
    path:
      toExternalImageProxyUrl(storagePath, {
        publicPathBase: HOME_IMAGE_PUBLIC_BASE,
      }) ?? storagePath,
    storagePath,
  }
})
