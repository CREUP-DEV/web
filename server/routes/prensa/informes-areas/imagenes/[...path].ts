import { createPublicAssetRouteHandler } from '../../../../utils/public/publicAsset'
import { AREA_REPORTS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

// Serves area-report images from the public uploads volume in the standalone build (plan §9.1).
export default createPublicAssetRouteHandler({ pathBase: AREA_REPORTS_IMAGE_PUBLIC_BASE })
