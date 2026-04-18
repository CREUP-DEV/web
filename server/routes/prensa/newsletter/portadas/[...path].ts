import { defineEventHandler } from 'h3'
import {
  throwPublicAssetNotFound,
  tryServePublicAssetByPathBase,
} from '../../../../utils/publicAsset'
import { NEWSLETTER_COVER_IMAGE_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, NEWSLETTER_COVER_IMAGE_PUBLIC_PATH)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
