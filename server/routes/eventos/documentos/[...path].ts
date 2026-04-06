import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/externalAssetProxy'
import { EVENT_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler((event) =>
  proxyExternalAssetByPublicPathBase(event, 'pdf', EVENT_DOCUMENT_PUBLIC_BASE)
)
