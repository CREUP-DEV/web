import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineAdminUploadHandler({
  uploadDir: 'public/documentos/igualdad',
  publicPath: EQUALITY_DOCUMENTS_PUBLIC_PATH,
  kind: 'pdf',
  maxRequestBytes: 22 * 1024 * 1024, // 22 MB hard ceiling (above PDF limit)
})
