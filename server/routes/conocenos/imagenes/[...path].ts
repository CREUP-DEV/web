import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/external/externalAssetProxy'
import { tryServePublicAssetByPathBase } from '../../../utils/public/publicAsset'

export default defineEventHandler(async (event) => {
  const localAsset = await tryServePublicAssetByPathBase(event, '/conocenos/imagenes')

  if (localAsset) {
    return localAsset
  }

  return proxyExternalAssetByPublicPathBase(event, 'image', '/conocenos/imagenes')
})
