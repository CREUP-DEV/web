import { defineEventHandler } from 'h3'
import {
  throwPublicAssetNotFound,
  tryServePublicAssetByPathBase,
} from '../../utils/public/publicAsset'
import { SITE_OG_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, SITE_OG_IMAGE_PUBLIC_PATH)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
