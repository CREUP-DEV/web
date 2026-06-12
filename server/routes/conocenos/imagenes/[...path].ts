import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { ABOUT_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: ABOUT_IMAGE_PUBLIC_PATH,
  external: { kind: 'image' },
})
