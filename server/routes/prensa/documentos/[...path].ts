import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { PRESS_DOCUMENT_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({ pathBase: PRESS_DOCUMENT_PUBLIC_PATH })
