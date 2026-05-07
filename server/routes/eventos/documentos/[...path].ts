import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/external/externalAssetProxy'
import { tryServePublicAssetByPathBase } from '../../../utils/public/publicAsset'
import { EVENT_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const localAsset = await tryServePublicAssetByPathBase(event, EVENT_DOCUMENT_PUBLIC_BASE)

  if (localAsset) {
    return localAsset
  }

  return proxyExternalAssetByPublicPathBase(event, 'pdf', EVENT_DOCUMENT_PUBLIC_BASE)
})
