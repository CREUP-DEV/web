import { defineEventHandler } from 'h3'
import { throwPublicAssetNotFound, tryServePublicAssetByPathBase } from '../../../utils/publicAsset'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, FINANCIAL_REPORTS_PUBLIC_PATH)

  if (asset === null) {
    throwPublicAssetNotFound()
  }

  return asset
})
