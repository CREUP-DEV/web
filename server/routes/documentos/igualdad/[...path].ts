import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { EQUALITY_DOCUMENTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: EQUALITY_DOCUMENTS_PUBLIC_PATH,
  external: { kind: 'pdf', notFoundOnExternal404: true },
})
