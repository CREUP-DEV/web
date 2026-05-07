import type { H3Event } from 'h3'
import { getRequiredExternalAssetProxyTimeoutMs } from '../core/runtimeConfig'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from '../cache/externalApiCache'
import { logError } from '../core/logger'
import {
  externalAssetProxyDispatcher,
  getExternalAssetProxyConfig,
} from './externalAssetProxyConfig'
import { fetchExternalAssetWithSafeRedirects } from './externalAssetFetch'
import {
  appendAssetKindHint,
  canonicalizeExternalAssetUrl,
  getImageKindFromPathname,
  isSpecialUrl,
  resolveSourceUrl,
  toExternalImageProxyUrl,
} from './externalAssetUrl'

const getAssetAcceptHeader = () => 'image/*'

export async function isExternalImageSvg(source: string | null | undefined, event: H3Event) {
  const normalizedSource = source?.trim()
  if (!normalizedSource || isSpecialUrl(normalizedSource)) {
    return false
  }

  try {
    const { allowedOrigins, assetBaseUrl: configuredBaseUrl } = getExternalAssetProxyConfig(event)
    const sourceUrl = canonicalizeExternalAssetUrl(
      resolveSourceUrl(normalizedSource, configuredBaseUrl),
      configuredBaseUrl,
      allowedOrigins
    )
    const imageKindFromPathname = getImageKindFromPathname(sourceUrl.pathname)

    if (imageKindFromPathname) {
      return imageKindFromPathname === 'svg'
    }

    return await withExternalApiSWRCache(
      `external-asset-kind:image:${sourceUrl.toString()}`,
      async () => {
        if (!['http:', 'https:'].includes(sourceUrl.protocol)) {
          return false
        }

        if (sourceUrl.username || sourceUrl.password || !allowedOrigins.has(sourceUrl.origin)) {
          return false
        }

        const timeoutMs = getRequiredExternalAssetProxyTimeoutMs(event)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
        const requestHeaders = new Headers({ accept: getAssetAcceptHeader() })
        const methodCandidates: Array<'HEAD' | 'GET'> = ['HEAD', 'GET']

        try {
          for (const method of methodCandidates) {
            const response = await fetchExternalAssetWithSafeRedirects(sourceUrl.toString(), {
              allowedOrigins,
              createError: (reason) => new Error(`External asset redirect failed: ${reason}`),
              dispatcher: externalAssetProxyDispatcher,
              headers: requestHeaders,
              method,
              signal: controller.signal,
            })

            if ((response.status === 405 || response.status === 501) && method === 'HEAD') {
              continue
            }

            if (![200, 204, 206, 304].includes(response.status)) {
              return false
            }

            const contentType = response.headers.get('content-type')?.toLowerCase() ?? ''
            if (method === 'GET') {
              await response.body?.cancel()
            }

            if (contentType.includes('image/svg+xml')) {
              return true
            }

            if (contentType.startsWith('image/')) {
              return false
            }
          }

          return false
        } finally {
          clearTimeout(timeoutId)
        }
      },
      getExternalApiCacheOptions(event)
    )
  } catch (error) {
    logError('external-asset.kind-detection', error, { source: normalizedSource }, event)
    return false
  }
}

export async function toExternalImageProxyUrlWithKindHint(
  src: string | null | undefined,
  options: ExternalAssetProxyUrlOptions = {}
) {
  const resolvedUrl = toExternalImageProxyUrl(src, options)
  if (!resolvedUrl || !src || !options.event) {
    return resolvedUrl
  }

  return (await isExternalImageSvg(src, options.event))
    ? appendAssetKindHint(resolvedUrl, 'svg')
    : resolvedUrl
}
