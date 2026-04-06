import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'
import { saveAdminDocument } from '../../../utils/adminDocumentUpload'
import { validateMultipartFile } from '../../../utils/validation'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/prensa/dossier'

export default defineEventHandler(async (event) => {
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
