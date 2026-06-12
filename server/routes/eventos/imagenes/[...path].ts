import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { EVENT_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: EVENT_IMAGE_PUBLIC_BASE,
  external: { kind: 'image' },
})
