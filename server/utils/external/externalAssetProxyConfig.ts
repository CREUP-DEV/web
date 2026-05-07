import type { H3Event } from 'h3'
import { Agent, type Dispatcher } from 'undici'
import {
  getDefaultPublicApiErrorMessage,
  getPublicApiErrorMessage,
  type PublicApiErrorMessageKey,
} from '../locale/apiErrorMessages'
import {
  getRequiredExternalAssetBaseUrl,
  getRequiredExternalAssetProxyAllowedOrigins,
} from '../core/runtimeConfig'

export type ExternalAssetType = 'image' | 'pdf'

export interface ExternalAssetProxyUrlOptions {
  event?: H3Event
  forceProxyRelative?: boolean
  publicPathBase?: string
}

const EXTERNAL_ASSET_PROXY_CONNECTIONS = 8
const EXTERNAL_ASSET_PROXY_CONNECT_TIMEOUT_MS = 5_000
const EXTERNAL_ASSET_PROXY_HEADERS_TIMEOUT_MS = 30_000
const EXTERNAL_ASSET_PROXY_BODY_TIMEOUT_MS = 30_000
const EXTERNAL_ASSET_PROXY_KEEP_ALIVE_TIMEOUT_MS = 5_000
const EXTERNAL_ASSET_PROXY_KEEP_ALIVE_MAX_TIMEOUT_MS = 60_000
const EXTERNAL_ASSET_PROXY_MAX_ORIGINS = 16

export const externalAssetProxyDispatcher = new Agent({
  bodyTimeout: EXTERNAL_ASSET_PROXY_BODY_TIMEOUT_MS,
  connectTimeout: EXTERNAL_ASSET_PROXY_CONNECT_TIMEOUT_MS,
  connections: EXTERNAL_ASSET_PROXY_CONNECTIONS,
  headersTimeout: EXTERNAL_ASSET_PROXY_HEADERS_TIMEOUT_MS,
  keepAliveMaxTimeout: EXTERNAL_ASSET_PROXY_KEEP_ALIVE_MAX_TIMEOUT_MS,
  keepAliveTimeout: EXTERNAL_ASSET_PROXY_KEEP_ALIVE_TIMEOUT_MS,
  maxOrigins: EXTERNAL_ASSET_PROXY_MAX_ORIGINS,
  pipelining: 1,
})

export interface ExternalAssetProxyRequestInit extends RequestInit {
  dispatcher?: Dispatcher
}

interface ExternalAssetProxyAgentStats {
  configuredConnectionsPerOrigin: number
  connected: number
  free: number
  origins: number
  pending: number
  queued: number
  running: number
  size: number
}

export const getPublicMessage = (key: PublicApiErrorMessageKey, event?: H3Event) =>
  event ? getPublicApiErrorMessage(event, key) : getDefaultPublicApiErrorMessage(key)

interface CachedExternalAssetProxyConfig {
  allowedOrigins: Set<string>
  assetBaseOrigin: string | null
  assetBaseUrl: string
}

interface CachedExternalAssetProxyConfigState {
  expiresAt: number
  value: CachedExternalAssetProxyConfig
}

const EXTERNAL_ASSET_PROXY_CONFIG_TTL_MS = 60_000
let cachedExternalAssetProxyConfig: CachedExternalAssetProxyConfigState | null = null

export function invalidateExternalAssetProxyConfigCache() {
  cachedExternalAssetProxyConfig = null
}

const readStatsNumber = (stats: unknown, key: string) => {
  if (!stats || typeof stats !== 'object') return 0
  const value = (stats as Record<string, unknown>)[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

const getDispatcherStats = (dispatcher: unknown) => {
  const stats =
    dispatcher && typeof dispatcher === 'object'
      ? (dispatcher as { stats?: unknown }).stats
      : undefined

  return {
    connected: readStatsNumber(stats, 'connected'),
    free: readStatsNumber(stats, 'free'),
    pending: readStatsNumber(stats, 'pending'),
    queued: readStatsNumber(stats, 'queued'),
    running: readStatsNumber(stats, 'running'),
    size: readStatsNumber(stats, 'size'),
  }
}

const getAgentClientDispatchers = () => {
  const clientsSymbol = Object.getOwnPropertySymbols(externalAssetProxyDispatcher).find(
    (symbol) => String(symbol) === 'Symbol(clients)'
  )

  if (!clientsSymbol) return []

  const clients = (externalAssetProxyDispatcher as unknown as Record<symbol, unknown>)[
    clientsSymbol
  ]

  if (!(clients instanceof Map)) return []

  return Array.from(clients.values()).map((client) => {
    if (client && typeof client === 'object' && 'deref' in client) {
      return (client as { deref: () => unknown }).deref()
    }

    return client
  })
}

export function getExternalAssetProxyAgentStats(): ExternalAssetProxyAgentStats {
  const clientDispatchers = getAgentClientDispatchers().filter(Boolean)
  const directStats = getDispatcherStats(externalAssetProxyDispatcher)
  const baseStats =
    clientDispatchers.length === 0
      ? directStats
      : { connected: 0, free: 0, pending: 0, queued: 0, running: 0, size: 0 }
  const aggregateStats = clientDispatchers.reduce((acc, dispatcher) => {
    const stats = getDispatcherStats(dispatcher)
    acc.connected += stats.connected
    acc.free += stats.free
    acc.pending += stats.pending
    acc.queued += stats.queued
    acc.running += stats.running
    acc.size += stats.size
    return acc
  }, baseStats)

  return {
    configuredConnectionsPerOrigin: EXTERNAL_ASSET_PROXY_CONNECTIONS,
    origins: clientDispatchers.length,
    ...aggregateStats,
  }
}

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

const parseAllowedOrigins = (value: string) => {
  const origins = new Set<string>()

  for (const token of value.split(',')) {
    const normalized = normalizeOrigin(token.trim())
    if (normalized) origins.add(normalized)
  }

  return origins
}

export const getExternalAssetProxyConfig = (event?: H3Event) => {
  const now = Date.now()

  if (cachedExternalAssetProxyConfig && cachedExternalAssetProxyConfig.expiresAt > now) {
    return cachedExternalAssetProxyConfig.value
  }

  const assetBaseUrl = getRequiredExternalAssetBaseUrl(
    event,
    getPublicMessage('assetProxyNotConfigured', event)
  )
  const assetBaseOrigin = normalizeOrigin(assetBaseUrl)
  const allowedOrigins = parseAllowedOrigins(
    getRequiredExternalAssetProxyAllowedOrigins(
      event,
      getPublicMessage('assetProxyNotConfigured', event)
    )
  )

  if (assetBaseOrigin) allowedOrigins.add(assetBaseOrigin)

  const config = { allowedOrigins, assetBaseOrigin, assetBaseUrl }
  cachedExternalAssetProxyConfig = {
    value: config,
    expiresAt: now + EXTERNAL_ASSET_PROXY_CONFIG_TTL_MS,
  }
  return config
}
