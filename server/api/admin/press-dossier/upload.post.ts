import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { PRESS_DOSSIER_STORAGE_PATH } from '~~/shared/constants/assetPaths'

export default defineAdminUploadHandler({
  uploadDir: `public${PRESS_DOSSIER_STORAGE_PATH}`,
  publicPath: PRESS_DOSSIER_STORAGE_PATH,
  kind: 'pdf',
  maxRequestBytes: 22 * 1024 * 1024, // 22 MB hard ceiling
})
