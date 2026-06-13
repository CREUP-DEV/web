import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { PRESS_DOSSIER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

const PRESS_DOSSIER_PUBLIC_BASE = PRESS_DOSSIER_PUBLIC_PATH.slice(
  0,
  PRESS_DOSSIER_PUBLIC_PATH.lastIndexOf('/')
)

export default defineAdminUploadHandler({
  uploadDir: 'public/prensa',
  publicPath: PRESS_DOSSIER_PUBLIC_BASE,
  kind: 'pdf',
  maxRequestBytes: 22 * 1024 * 1024, // 22 MB hard ceiling
})
