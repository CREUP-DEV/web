import type { MaybeRefOrGetter } from 'vue'
import { serializeJsonForHtmlScript } from '~~/shared/utils/json'
import { toAbsoluteUrl } from '~~/shared/utils/url'

export type WebPageSchemaType = 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'
export type StructuredDataNode = Record<string, unknown>

export interface BreadcrumbStructuredDataItem {
  name: string
  path: string | null | undefined
}

export interface OrganizationStructuredDataInput {
  name: string
  url?: string | null | undefined
}

export interface WebPageStructuredDataInput {
  name: string
  description?: string | null | undefined
  url?: string | null | undefined
  inLanguage?: string | null | undefined
  type?: WebPageSchemaType
}

export function createOrganizationStructuredData(
  input: OrganizationStructuredDataInput
): StructuredDataNode {
  const absoluteUrl = toAbsoluteUrl(input.url, input.url)

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: absoluteUrl || undefined,
  }
}

export function createBreadcrumbStructuredData(
  items: BreadcrumbStructuredDataItem[],
  siteUrl: string | null | undefined
): StructuredDataNode {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, siteUrl) || undefined,
    })),
  }
}

export function createWebPageStructuredData(input: WebPageStructuredDataInput): StructuredDataNode {
  const absoluteUrl = toAbsoluteUrl(input.url, input.url)

  return {
    '@context': 'https://schema.org',
    '@type': input.type ?? 'WebPage',
    name: input.name,
    description: input.description || undefined,
    url: absoluteUrl || undefined,
    inLanguage: input.inLanguage || undefined,
  }
}

export function useStructuredData(
  nodes: MaybeRefOrGetter<Record<string, unknown>[] | null | undefined>
) {
  useHead(() => {
    const resolvedNodes = toValue(nodes) ?? []

    if (resolvedNodes.length === 0) {
      return {}
    }

    return {
      script: resolvedNodes.map((node) => ({
        type: 'application/ld+json',
        innerHTML: serializeJsonForHtmlScript(node),
      })),
    }
  })
}
