import { createPublicAssetRouteHandler } from '../../../../utils/public/publicAsset'
import { NEWSLETTER_DOCUMENT_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({ pathBase: NEWSLETTER_DOCUMENT_PUBLIC_PATH })
