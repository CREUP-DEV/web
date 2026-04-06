import { defineEventHandler } from 'h3'
import { proxyExternalAssetByPublicPathBase } from '../../../utils/externalAssetProxy'
import { EVENT_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

export default defineEventHandler((event) =>
  proxyExternalAssetByPublicPathBase(event, 'image', EVENT_IMAGE_PUBLIC_BASE)
)
