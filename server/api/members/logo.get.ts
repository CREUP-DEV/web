import { defineEventHandler } from 'h3'
import { proxyExternalAsset } from '../../utils/externalAssetProxy'

export default defineEventHandler((event) => proxyExternalAsset(event, 'image'))
