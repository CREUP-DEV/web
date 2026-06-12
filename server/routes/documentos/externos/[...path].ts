import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'

export default createPublicAssetRouteHandler({
  pathBase: '/documentos/externos',
  external: { kind: 'pdf', serveLocalFirst: false },
})
