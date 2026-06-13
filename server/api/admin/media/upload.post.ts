import { defineAdminUploadHandler } from '../../../utils/admin/defineAdminUploadHandler'
import { PRESS_MEDIA_LOGO_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineAdminUploadHandler({
  uploadDir: 'public/prensa/imagenes/medios',
  publicPath: PRESS_MEDIA_LOGO_PUBLIC_PATH,
  kind: 'image',
  maxRequestBytes: 6 * 1024 * 1024, // 6 MB hard ceiling (above image limit)
})
