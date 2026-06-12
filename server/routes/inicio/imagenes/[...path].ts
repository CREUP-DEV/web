import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { HOME_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({ pathBase: HOME_IMAGE_PUBLIC_BASE })
