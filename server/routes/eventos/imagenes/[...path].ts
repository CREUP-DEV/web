import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/externalAssetProxy'
import { tryServePublicAssetByPathBase } from '../../../utils/publicAsset'
import { EVENT_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const localAsset = await tryServePublicAssetByPathBase(event, EVENT_IMAGE_PUBLIC_BASE)

  if (localAsset) {
    return localAsset
  }

  return proxyExternalAssetByPublicPathBase(event, 'image', EVENT_IMAGE_PUBLIC_BASE)
})
