import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalPdfProxyUrl } from '../../../utils/externalAssetProxy'
import { saveAdminDocument } from '../../../utils/adminDocumentUpload'
import { validateMultipartFile } from '../../../utils/validation'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/documentos/informes-economicos'

export default defineEventHandler(async (event) => {
  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(formData)

  const { storagePath } = await saveAdminDocument({
    data: Buffer.from(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
  })
  const path = toExternalPdfProxyUrl(storagePath) ?? storagePath

  return {
    path,
    storagePath,
  }
})
