import { createPublicAssetRouteHandler } from '../../../../utils/public/publicAsset'
import { NEWSLETTER_SITE_DEFAULT_COVER_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: NEWSLETTER_SITE_DEFAULT_COVER_PUBLIC_PATH,
})
