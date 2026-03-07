import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/externalAssetProxy'

export default defineEventHandler((event) =>
  proxyExternalAssetByPublicPathBase(event, 'pdf', '/documentos/externos')
)
