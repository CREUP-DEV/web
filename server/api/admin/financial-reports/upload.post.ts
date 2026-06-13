import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineAdminUploadHandler({
  uploadDir: 'public/documentos/informes-economicos',
  publicPath: FINANCIAL_REPORTS_PUBLIC_PATH,
  kind: 'pdf',
  maxRequestBytes: 22 * 1024 * 1024, // 22 MB hard ceiling (above PDF limit)
})
