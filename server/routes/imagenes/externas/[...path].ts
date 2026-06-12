import { createPublicAssetRouteHandler } from '../../../utils/public/publicAsset'

export default createPublicAssetRouteHandler({
  pathBase: '/imagenes/externas',
  external: { kind: 'image', serveLocalFirst: false },
})
