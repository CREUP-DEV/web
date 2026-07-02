import { createPublicAssetRouteHandler } from '../../../../utils/public/publicAsset'
import { ACTIVITY_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

// Serves activity entry images (and the nested imagenes-por-defecto/ fallbacks) from the public
// uploads volume in the standalone build. Without this the images 404 after deploy (plan §9.1).
export default createPublicAssetRouteHandler({ pathBase: ACTIVITY_IMAGE_PUBLIC_BASE })
