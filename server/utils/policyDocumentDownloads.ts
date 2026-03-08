import type { H3Event } from 'h3'
import { createError } from 'h3'
import { getExternalApiCacheOptions, withExternalApiSWRCache } from './externalApiCache'
import { externalPolicyDocumentsResponseSchema } from './validation'

const POLICY_DOCUMENT_ENDPOINT_BY_TYPE = {
  posicionamiento: '/api/posicionamientos',
  resolucion: '/api/resoluciones',
  'informe-ejecutivo': '/api/informes-ejecutivos',
} as const

const POLICY_DOCUMENT_TYPE_BY_API_PATH = {
  '/api/posicionamientos': 'posicionamiento',
  '/api/resoluciones': 'resolucion',
  '/api/informes-ejecutivos': 'informe-ejecutivo',
} as const

const POLICY_DOCUMENT_FILE_CACHE_VERSION = 1

type PolicyDocumentRouteType = keyof typeof POLICY_DOCUMENT_ENDPOINT_BY_TYPE

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
  const runtimeConfig = useRuntimeConfig(event)
  return String(runtimeConfig.externalMembersApiBaseUrl ?? '').trim()
}

const isPolicyDocumentRouteType = (value: string): value is PolicyDocumentRouteType =>
  Object.hasOwn(POLICY_DOCUMENT_ENDPOINT_BY_TYPE, value)

const normalizePolicyDocumentFileName = (value: string | null | undefined) => {
  const normalized = normalizeText(value).toLowerCase().replace(/\.+$/g, '')
  if (!normalized) {
    return ''
  }

  return normalized.endsWith('.pdf') ? normalized : `${normalized}.pdf`
}

const getLowerCasedFileNameFromUrl = (url: URL) =>
  normalizePolicyDocumentFileName(url.pathname.split('/').pop())

async function buildPolicyDocumentFileRegistryFromExternal(
  event: H3Event,
  type: PolicyDocumentRouteType
) {
  const configuredBaseUrl = getConfiguredBaseUrl(event)
  if (!configuredBaseUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: 'External members API is not configured.',
    })
  }

  const endpoint = new URL(POLICY_DOCUMENT_ENDPOINT_BY_TYPE[type], configuredBaseUrl).toString()
  const payload = await $fetch<unknown>(endpoint)
  const parsed = externalPolicyDocumentsResponseSchema.safeParse(payload)

  if (!parsed.success) {
    throw createError({
      statusCode: 502,
      statusMessage: 'Policy documents data is temporarily unavailable.',
    })
  }

  const registry: Record<string, string> = {}

  for (const document of parsed.data.data) {
    const rawFileUrl = normalizeText(document.file?.url)
    if (!rawFileUrl) {
      continue
    }

    const sourceUrl = resolveSourceUrl(rawFileUrl, configuredBaseUrl)
    const fileName = getLowerCasedFileNameFromUrl(sourceUrl)

    if (!fileName || registry[fileName]) {
      continue
    }

    registry[fileName] = sourceUrl.toString()
  }

  return registry
}

async function getPolicyDocumentRegistrySnapshot(event: H3Event, type: PolicyDocumentRouteType) {
  const configuredBaseUrl = getConfiguredBaseUrl(event)
  const cacheOptions = getExternalApiCacheOptions(event)

  return withExternalApiSWRCache(
    `external-api:policy-document-file-registry:v${POLICY_DOCUMENT_FILE_CACHE_VERSION}:${configuredBaseUrl}:${type}`,
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

  if (!type || !rawSource) {
    return null
  }

  const configuredBaseUrl = getConfiguredBaseUrl(event)
  if (!configuredBaseUrl) {
    return null
  }

  const sourceUrl = resolveSourceUrl(rawSource, configuredBaseUrl)
  const fileName = getLowerCasedFileNameFromUrl(sourceUrl)

  if (!fileName) {
    return null
  }

  const versionParam = sourceUrl.searchParams.get('v')
  const versionSuffix = versionParam ? `?v=${encodeURIComponent(versionParam)}` : ''
  return `/documentos/${type}/${fileName}${versionSuffix}`
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
  return registry[normalizedFileName] ?? null
}
