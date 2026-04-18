import { defineEventHandler } from 'h3'
import { throwPublicAssetNotFound, tryServePublicAssetByPathBase } from '../../../utils/publicAsset'
import { PRESS_DOCUMENT_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, PRESS_DOCUMENT_PUBLIC_PATH)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
