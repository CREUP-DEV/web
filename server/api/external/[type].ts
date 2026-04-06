import { defineEventHandler } from 'h3'
import { proxyExternalAsset } from '../../utils/externalAssetProxy'
import { externalAssetTypeRouteParamSchema, validateRouteParams } from '../../utils/validation'

export default defineEventHandler(async (event) => {
  const { type } = validateRouteParams(event, externalAssetTypeRouteParamSchema)

  return proxyExternalAsset(event, type)
})
