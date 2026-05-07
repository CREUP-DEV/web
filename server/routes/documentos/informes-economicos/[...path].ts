import { defineEventHandler } from 'h3'
import {
  throwPublicAssetNotFound,
  tryServePublicAssetByPathBase,
} from '../../../utils/public/publicAsset'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/external/externalAssetProxy'
import { FINANCIAL_REPORTS_PUBLIC_PATH } from '~~/shared/constants/assetPaths'

export default defineEventHandler(async (event) => {
  const asset = await tryServePublicAssetByPathBase(event, FINANCIAL_REPORTS_PUBLIC_PATH)

  if (asset) {
    return asset
  }

  try {
    return await proxyExternalAssetByPublicPathBase(event, 'pdf', FINANCIAL_REPORTS_PUBLIC_PATH)
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error && error.statusCode === 404) {
      throwPublicAssetNotFound()
    }

    throw error
  }
})
