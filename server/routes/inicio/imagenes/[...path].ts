import { defineEventHandler } from 'h3'
import {
  throwPublicAssetNotFound,
  tryServePublicAssetByPathBase,
} from '../../../utils/public/publicAsset'
import { HOME_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, HOME_IMAGE_PUBLIC_BASE)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
