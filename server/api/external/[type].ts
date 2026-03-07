import { createError, defineEventHandler, getRouterParam } from 'h3'
import { proxyExternalAsset } from '../../utils/externalAssetProxy'

export default defineEventHandler(async (event) => {
  const type = getRouterParam(event, 'type')

  if (type !== 'image' && type !== 'pdf') {
    throw createError({
      statusCode: 404,
      statusMessage: 'Asset type not found.',
    })
  }

  return proxyExternalAsset(event, type)
})
