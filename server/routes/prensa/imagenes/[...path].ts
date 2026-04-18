import { defineEventHandler } from 'h3'
import { throwPublicAssetNotFound, tryServePublicAssetByPathBase } from '../../../utils/publicAsset'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, PRESS_IMAGE_PUBLIC_BASE)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
