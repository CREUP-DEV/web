import { createPublicAssetRouteHandler } from '../../../../utils/public/publicAsset'
import { NEWSLETTER_COVER_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({ pathBase: NEWSLETTER_COVER_IMAGE_PUBLIC_PATH })
