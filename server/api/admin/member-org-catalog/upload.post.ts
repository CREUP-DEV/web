import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { MEMBER_ORG_LOGOS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineAdminUploadHandler({
  uploadDir: 'public/transparencia/actividad/imagenes/organizaciones',
  publicPath: MEMBER_ORG_LOGOS_PUBLIC_PATH,
  kind: 'image',
  maxRequestBytes: 6 * 1024 * 1024, // 6 MB hard ceiling (above the image limit)
})
