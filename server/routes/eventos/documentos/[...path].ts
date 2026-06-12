import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { EVENT_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: EVENT_DOCUMENT_PUBLIC_BASE,
  external: { kind: 'pdf' },
})
