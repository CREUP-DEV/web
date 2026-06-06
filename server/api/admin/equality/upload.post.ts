import { defineEventHandler, readMultipartFormData } from 'h3'
import { toExternalPdfProxyUrl } from '../../../utils/external/externalAssetUrl'
import { saveAdminDocument } from '../../../utils/admin/adminDocumentUpload'
import { assertUploadRequestSize } from '../../../utils/core/uploadRequestLimit'
import { getMultipartFileBuffer, validateMultipartFile } from '../../../utils/validation'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const UPLOAD_DIR = 'public/documentos/igualdad'
const UPLOAD_MAX_REQUEST_BYTES = 22 * 1024 * 1024 // 22 MB hard ceiling (above PDF limit)

export default defineEventHandler(async (event) => {
  await assertUploadRequestSize(
    event,
    UPLOAD_MAX_REQUEST_BYTES,
    getAdminApiErrorMessage(event, 'requestTooLarge')
  )

  const formData = await readMultipartFormData(event)
  const file = validateMultipartFile(event, formData)

  const { storagePath } = await saveAdminDocument({
    event,
    data: getMultipartFileBuffer(file.data),
    filename: file.filename,
    uploadDir: UPLOAD_DIR,
    publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
  })
  const path =
    toExternalPdfProxyUrl(storagePath, {
      publicPathBase: EQUALITY_DOCUMENTS_PUBLIC_PATH,
    }) ?? storagePath

  return {
    path,
    storagePath,
  }
})
