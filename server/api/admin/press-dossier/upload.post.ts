import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalPdfProxyUrl } from '../../../utils/external/externalAssetUrl'
import { saveAdminDocument } from '../../../utils/admin/adminDocumentUpload'
import { assertUploadRequestSize } from '../../../utils/core/uploadRequestLimit'
import { validateMultipartFile } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/prensa'
const UPLOAD_MAX_REQUEST_BYTES = 22 * 1024 * 1024 // 22 MB hard ceiling
const PRESS_DOSSIER_PUBLIC_BASE = PRESS_DOSSIER_PUBLIC_PATH.slice(
  0,
  PRESS_DOSSIER_PUBLIC_PATH.lastIndexOf('/')
)

export default defineEventHandler(async (event) => {
  assertUploadRequestSize(event, UPLOAD_MAX_REQUEST_BYTES, 'Solicitud demasiado grande')

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)

  const { storagePath } = await saveAdminDocument({
    data: Buffer.from(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: PRESS_DOSSIER_PUBLIC_BASE,
  })

  return {
    path:
      toExternalPdfProxyUrl(storagePath, {
        publicPathBase: PRESS_DOSSIER_PUBLIC_BASE,
      }) ?? storagePath,
    storagePath,
  }
})
