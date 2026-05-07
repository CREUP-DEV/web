import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/external/externalAssetProxy'

export default defineEventHandler((event) =>
  proxyExternalAssetByPublicPathBase(event, 'image', '/imagenes/externas')
)
