import { fetch } from 'undici'
import type { ExternalAssetProxyRequestInit } from './externalAssetProxyConfig'

type SafeRedirectErrorReason =
  | 'invalid_origin'
  | 'invalid_protocol'
  | 'invalid_url'
  | 'missing_location'
  | 'too_many_redirects'

interface FetchExternalAssetWithSafeRedirectsOptions {
  allowedOrigins: Set<string>
  createError: (reason: SafeRedirectErrorReason) => unknown
  dispatcher: ExternalAssetProxyRequestInit['dispatcher']
  headers: Headers
  maxRedirects?: number
  method: 'GET' | 'HEAD'
  signal: AbortSignal
}

export async function fetchExternalAssetWithSafeRedirects(
  url: string,
  options: FetchExternalAssetWithSafeRedirectsOptions,
  hops = 0
): Promise<Response> {
  const maxRedirects = options.maxRedirects ?? 5

  if (hops > maxRedirects) {
    throw options.createError('too_many_redirects')
  }

  const requestInit: ExternalAssetProxyRequestInit = {
    dispatcher: options.dispatcher,
    method: options.method,
    headers: options.headers,
    redirect: 'manual',
    signal: options.signal,
  }
  const response = (await fetch(
    url,
    requestInit as Parameters<typeof fetch>[1]
  )) as unknown as Response

  if (response.status < 300 || response.status >= 400) {
    return response
  }

  const location = response.headers.get('location')
  if (!location) {
    await response.body?.cancel()
    throw options.createError('missing_location')
  }

  let nextUrl: URL
  try {
    nextUrl = new URL(location, url)
  } catch {
    await response.body?.cancel()
    throw options.createError('invalid_url')
  }

  if (!['http:', 'https:'].includes(nextUrl.protocol)) {
    await response.body?.cancel()
    throw options.createError('invalid_protocol')
  }

  if (nextUrl.username || nextUrl.password) {
    await response.body?.cancel()
    throw options.createError('invalid_url')
  }

  if (!options.allowedOrigins.has(nextUrl.origin)) {
    await response.body?.cancel()
    throw options.createError('invalid_origin')
  }

  await response.body?.cancel()
  return fetchExternalAssetWithSafeRedirects(nextUrl.toString(), options, hops + 1)
}
