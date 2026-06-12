import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({ pathBase: PRESS_IMAGE_PUBLIC_BASE })
