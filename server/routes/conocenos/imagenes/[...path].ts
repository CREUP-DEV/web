import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/externalAssetProxy'
import { tryServePublicAssetByPathBase } from '../../../utils/publicAsset'

export default defineEventHandler(async (event) => {
  const localAsset = await tryServePublicAssetByPathBase(event, '/conocenos/imagenes')

  if (localAsset) {
    return localAsset
  }

  return proxyExternalAssetByPublicPathBase(event, 'image', '/conocenos/imagenes')
})
