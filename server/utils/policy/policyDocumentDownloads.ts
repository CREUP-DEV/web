import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getPublicApiErrorMessage } from '../locale/apiErrorMessages'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from '../cache/externalApiCache'
import { toExternalPdfProxyUrl } from '../external/externalAssetUrl'
import {
  getRequiredExternalApiBaseUrl,
  getRequiredExternalAssetBaseUrl,
} from '../core/runtimeConfig'
import {
  externalNormativaResponseSchema,
  externalPolicyDocumentsResponseSchema,
} from '../validation'
import { EXTERNAL_DOCUMENT_PUBLIC_BASE } from '~~/shared/constants/assetPaths'

const POLICY_DOCUMENT_ENDPOINT_BY_TYPE = {
  posicionamiento: '/api/posicionamientos',
  resolucion: '/api/resoluciones',
  'informe-ejecutivo': '/api/informes-ejecutivos',
  normativa: '/api/normativa',
} as const

const POLICY_DOCUMENT_TYPE_BY_API_PATH = {
  '/api/posicionamientos': 'posicionamiento',
  '/api/resoluciones': 'resolucion',
  '/api/informes-ejecutivos': 'informe-ejecutivo',
  '/api/normativa': 'normativa',
} as const

const POLICY_DOCUMENT_ERROR_MESSAGE_KEY_BY_TYPE = {
  posicionamiento: 'policyDocumentsUnavailable',
  resolucion: 'policyDocumentsUnavailable',
  'informe-ejecutivo': 'policyDocumentsUnavailable',
  normativa: 'normativaUnavailable',
} as const

const POLICY_DOCUMENT_FILE_CACHE_VERSION = 1

type PolicyDocumentRouteType = keyof typeof POLICY_DOCUMENT_ENDPOINT_BY_TYPE

interface PolicyDocumentFileRegistrySnapshot {
  byFileName: Record<string, string>
  bySourceUrl: Record<string, string>
}

const normalizeText = (value: string | null | undefined) => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

const resolveSourceUrl = (source: string, baseUrl: string) => {
  try {
    return new URL(source)
  } catch {
    return new URL(source, baseUrl)
  }
}

const getConfiguredBaseUrl = (event: H3Event) => {
  return getRequiredExternalApiBaseUrl(event)
}

const getConfiguredAssetBaseUrl = (event: H3Event) => {
  return getRequiredExternalAssetBaseUrl(event)
}

const isPolicyDocumentRouteType = (value: string): value is PolicyDocumentRouteType =>
  Object.hasOwn(POLICY_DOCUMENT_ENDPOINT_BY_TYPE, value)

const toPolicyDocumentFallbackPdfPath = (source: string | null | undefined) =>
  toExternalPdfProxyUrl(source, {
    forceProxyRelative: true,
    publicPathBase: EXTERNAL_DOCUMENT_PUBLIC_BASE,
  })

const normalizePolicyDocumentFileName = (value: string | null | undefined) => {
  const sanitizedValue = normalizeText(value)
    .replace(/\.pdf--[a-f0-9]{8,}(?=\.pdf$|$)/gi, '.pdf')
    .replace(/--[a-f0-9]{8,}(?=\.pdf$|$)/gi, '')

  const normalized = sanitizedValue
    .toLowerCase()
    .replace(/\.+$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (!normalized) {
    return ''
  }

  const baseName = normalized.replace(/-pdf$/i, '') || 'documento'
  return baseName.endsWith('.pdf') ? baseName : `${baseName}.pdf`
}

const getPolicyDocumentPublicFileStem = (
  sourceUrl: URL,
  preferredName?: string | null,
  fallbackName?: string | null
) => {
  const preferredFileName = normalizePolicyDocumentFileName(preferredName)
  if (preferredFileName) {
    return preferredFileName.replace(/\.pdf$/i, '')
  }

  const fallbackFileName = normalizePolicyDocumentFileName(fallbackName)
  if (fallbackFileName) {
    return fallbackFileName.replace(/\.pdf$/i, '')
  }

  const sourceFileName = normalizePolicyDocumentFileName(sourceUrl.pathname.split('/').pop())
  return sourceFileName.replace(/\.pdf$/i, '') || 'documento'
}

const assignUniquePolicyDocumentFileName = (
  sourceUrl: URL,
  byFileName: Record<string, string>,
  bySourceUrl: Record<string, string>,
  preferredName?: string | null,
  fallbackName?: string | null
) => {
  const sourceKey = sourceUrl.toString()
  const existingFileName = bySourceUrl[sourceKey]
  if (existingFileName) {
    return existingFileName
  }

  const sourceStem = getPolicyDocumentPublicFileStem(sourceUrl, preferredName, fallbackName)
  let suffix = 0

  while (true) {
    const candidate = suffix === 0 ? `${sourceStem}.pdf` : `${sourceStem}-${String(suffix + 1)}.pdf`
    const existingSource = byFileName[candidate]

    if (!existingSource || existingSource === sourceKey) {
      byFileName[candidate] = sourceKey
      bySourceUrl[sourceKey] = candidate
      return candidate
    }

    suffix += 1
  }
}

const registerPolicyDocumentFile = (
  rawFileUrl: string | null | undefined,
  configuredAssetBaseUrl: string,
  byFileName: Record<string, string>,
  bySourceUrl: Record<string, string>,
  preferredName?: string | null,
  fallbackName?: string | null
) => {
  const normalizedFileUrl = normalizeText(rawFileUrl)
  if (!normalizedFileUrl) {
    return
  }

  const sourceUrl = resolveSourceUrl(normalizedFileUrl, configuredAssetBaseUrl)
  assignUniquePolicyDocumentFileName(
    sourceUrl,
    byFileName,
    bySourceUrl,
    preferredName,
    fallbackName
  )
}

async function buildPolicyDocumentFileRegistryFromExternal(
  event: H3Event,
  type: PolicyDocumentRouteType
) {
  const configuredBaseUrl = getConfiguredBaseUrl(event)
  const configuredAssetBaseUrl = getConfiguredAssetBaseUrl(event)
  const unavailableMessage = getPublicApiErrorMessage(
    event,
    POLICY_DOCUMENT_ERROR_MESSAGE_KEY_BY_TYPE[type]
  )

  const endpoint = new URL(POLICY_DOCUMENT_ENDPOINT_BY_TYPE[type], configuredBaseUrl).toString()
  const payload = await $fetch<unknown>(endpoint)
  const byFileName: Record<string, string> = {}
  const bySourceUrl: Record<string, string> = {}

  if (type === 'normativa') {
    const parsed = externalNormativaResponseSchema.safeParse(payload)

    if (!parsed.success) {
      throw createError({
        statusCode: 502,
        message: unavailableMessage,
      })
    }

    for (const category of parsed.data.data) {
      for (const document of category.documents) {
        registerPolicyDocumentFile(
          document.file?.url,
          configuredAssetBaseUrl,
          byFileName,
          bySourceUrl,
          normalizeText(document.name),
          normalizeText(document.file?.name)
        )
      }
    }
  } else {
    const parsed = externalPolicyDocumentsResponseSchema.safeParse(payload)

    if (!parsed.success) {
      throw createError({
        statusCode: 502,
        message: unavailableMessage,
      })
    }

    for (const document of parsed.data.data) {
      registerPolicyDocumentFile(
        document.file?.url,
        configuredAssetBaseUrl,
        byFileName,
        bySourceUrl,
        normalizeText(document.name),
        normalizeText(document.file?.name)
      )
    }
  }

  return {
    byFileName,
    bySourceUrl,
  } satisfies PolicyDocumentFileRegistrySnapshot
}

async function getPolicyDocumentRegistrySnapshot(event: H3Event, type: PolicyDocumentRouteType) {
  const configuredBaseUrl = getConfiguredBaseUrl(event)
  const configuredAssetBaseUrl = getConfiguredAssetBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  return withExternalApiSWRCache(
    `external-api:policy-document-file-registry:v${POLICY_DOCUMENT_FILE_CACHE_VERSION}:${configuredBaseUrl}:${configuredAssetBaseUrl}:${type}`,
    async () => buildPolicyDocumentFileRegistryFromExternal(event, type),
    cacheOptions
  )
}

export async function toPolicyDocumentPublicPdfPathAsync(
  event: H3Event,
  apiPath: string,
  source: string | null | undefined
) {
  const type =
    POLICY_DOCUMENT_TYPE_BY_API_PATH[apiPath as keyof typeof POLICY_DOCUMENT_TYPE_BY_API_PATH]
  const rawSource = normalizeText(source)
  const fallbackUrl = toPolicyDocumentFallbackPdfPath(rawSource)

  if (!rawSource) {
    return null
  }

  if (!type) {
    return fallbackUrl ?? rawSource
  }

  try {
    const configuredAssetBaseUrl = getConfiguredAssetBaseUrl(event)
    const sourceUrl = resolveSourceUrl(rawSource, configuredAssetBaseUrl)
    const registry = await getPolicyDocumentRegistrySnapshot(event, type)
    const fileName = registry.bySourceUrl[sourceUrl.toString()]

    return fileName ? `/documentos/${type}/${fileName}` : (fallbackUrl ?? rawSource)
  } catch {
    return fallbackUrl ?? rawSource
  }
}

export async function resolvePolicyDocumentSourceByTypeAndFileName(
  event: H3Event,
  type: string,
  fileName: string
) {
  const normalizedType = normalizeText(type).toLowerCase()
  const normalizedFileName = normalizePolicyDocumentFileName(fileName)

  if (!isPolicyDocumentRouteType(normalizedType) || !normalizedFileName) {
    return null
  }

  const registry = await getPolicyDocumentRegistrySnapshot(event, normalizedType)
  return registry.byFileName[normalizedFileName] ?? null
}
