import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default createPublicAssetRouteHandler({
  pathBase: FINANCIAL_REPORTS_PUBLIC_PATH,
  external: { kind: 'pdf', notFoundOnExternal404: true },
})
