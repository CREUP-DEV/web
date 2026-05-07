import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { siteDefaultImages } from '../../db/schema'
import {
  SITE_DEFAULT_IMAGE_SCOPE,
  SITE_DEFAULT_IMAGE_SLOT,
  getSiteDefaultSlotDefinition,
} from '~~/shared/constants/siteDefaultImages'
import { toExternalImageProxyUrl } from '../external/externalAssetUrl'
import { PRESS_IMAGE_PUBLIC_BASE } from '~~/shared/constants/assetPaths'
import type { PressArticleType } from '~~/shared/constants/pressTypes'
import { appendAssetVersion } from '../core/assetVersion'

export type PressDefaultCoversRow = {
  pressReleaseImage: string | null
  statementImage: string | null
  mediaAppearanceImage: string | null
}

export interface SiteDefaultImageEntry {
  image: string | null
  updatedAt: Date | null
}

export type PressDefaultCoverEntriesRow = {
  pressReleaseImage: SiteDefaultImageEntry | null
  statementImage: SiteDefaultImageEntry | null
  mediaAppearanceImage: SiteDefaultImageEntry | null
}

type NestedDefaults = Map<string, Map<string, string | null>>
type NestedDefaultEntries = Map<string, Map<string, SiteDefaultImageEntry>>

function buildNestedMap(
  rows: { scope: string; slot: string; image: string | null }[]
): NestedDefaults {
  const map: NestedDefaults = new Map()
  for (const row of rows) {
    if (!map.has(row.scope)) {
      map.set(row.scope, new Map())
    }
    map.get(row.scope)!.set(row.slot, row.image)
  }
  return map
}

function buildNestedEntryMap(
  rows: { scope: string; slot: string; image: string | null; updatedAt: Date }[]
): NestedDefaultEntries {
  const map: NestedDefaultEntries = new Map()
  for (const row of rows) {
    if (!map.has(row.scope)) {
      map.set(row.scope, new Map())
    }
    map.get(row.scope)!.set(row.slot, {
      image: row.image,
      updatedAt: row.updatedAt ?? null,
    })
  }
  return map
}

export async function loadSiteDefaultImagesMap(): Promise<NestedDefaults> {
  const rows = await db.query.siteDefaultImages.findMany({
    columns: { scope: true, slot: true, image: true },
  })
  return buildNestedMap(rows)
}

export async function loadSiteDefaultImageEntriesMap(): Promise<NestedDefaultEntries> {
  const rows = await db.query.siteDefaultImages.findMany({
    columns: { scope: true, slot: true, image: true, updatedAt: true },
  })
  return buildNestedEntryMap(rows)
}

export function getPressDefaultCoversRowFromMap(map: NestedDefaults): PressDefaultCoversRow | null {
  const press = map.get(SITE_DEFAULT_IMAGE_SCOPE.press)
  if (!press) {
    return null
  }
  return {
    pressReleaseImage: press.get(SITE_DEFAULT_IMAGE_SLOT.pressRelease) ?? null,
    statementImage: press.get(SITE_DEFAULT_IMAGE_SLOT.statement) ?? null,
    mediaAppearanceImage: press.get(SITE_DEFAULT_IMAGE_SLOT.mediaAppearance) ?? null,
  }
}

export async function getPressDefaultCoversRow(): Promise<PressDefaultCoversRow | null> {
  const map = await loadSiteDefaultImagesMap()
  return getPressDefaultCoversRowFromMap(map)
}

export function getPressDefaultCoverEntriesRowFromMap(
  map: NestedDefaultEntries
): PressDefaultCoverEntriesRow | null {
  const press = map.get(SITE_DEFAULT_IMAGE_SCOPE.press)
  if (!press) {
    return null
  }

  return {
    pressReleaseImage: press.get(SITE_DEFAULT_IMAGE_SLOT.pressRelease) ?? null,
    statementImage: press.get(SITE_DEFAULT_IMAGE_SLOT.statement) ?? null,
    mediaAppearanceImage: press.get(SITE_DEFAULT_IMAGE_SLOT.mediaAppearance) ?? null,
  }
}

export async function getPressDefaultCoverEntriesRow(): Promise<PressDefaultCoverEntriesRow | null> {
  const map = await loadSiteDefaultImageEntriesMap()
  return getPressDefaultCoverEntriesRowFromMap(map)
}

/**
 * Resolves the public image URL for a press article, using type defaults when `image` is null.
 */
export function resolvePressArticleListImage(
  type: PressArticleType,
  image: string | null,
  defaults: PressDefaultCoversRow | null
): string | null {
  if (image) {
    return toExternalImageProxyUrl(image, { publicPathBase: PRESS_IMAGE_PUBLIC_BASE }) ?? image
  }
  if (!defaults) return null
  const raw =
    type === 'press_release'
      ? defaults.pressReleaseImage
      : type === 'statement'
        ? defaults.statementImage
        : defaults.mediaAppearanceImage
  if (!raw) return null
  return toExternalImageProxyUrl(raw, { publicPathBase: PRESS_IMAGE_PUBLIC_BASE }) ?? raw
}

export function resolvePressArticleListImageWithVersion(
  type: PressArticleType,
  image: string | null,
  updatedAt: Date | null | undefined,
  defaults: PressDefaultCoverEntriesRow | null
): string | null {
  if (image) {
    const resolved =
      toExternalImageProxyUrl(image, { publicPathBase: PRESS_IMAGE_PUBLIC_BASE }) ?? image
    return appendAssetVersion(resolved, updatedAt)
  }

  if (!defaults) {
    return null
  }

  const entry =
    type === 'press_release'
      ? defaults.pressReleaseImage
      : type === 'statement'
        ? defaults.statementImage
        : defaults.mediaAppearanceImage

  if (!entry?.image) {
    return null
  }

  const resolved =
    toExternalImageProxyUrl(entry.image, { publicPathBase: PRESS_IMAGE_PUBLIC_BASE }) ?? entry.image

  return appendAssetVersion(resolved, entry.updatedAt)
}

export function getSiteDefaultImageEntry(
  map: NestedDefaultEntries,
  scope: string,
  slot: string
): SiteDefaultImageEntry | null {
  return map.get(scope)?.get(slot) ?? null
}

export function resolveSiteDefaultImageUrl(
  map: NestedDefaults,
  scope: string,
  slot: string
): string | null {
  const def = getSiteDefaultSlotDefinition(scope, slot)
  const raw = map.get(scope)?.get(slot) ?? null
  if (!raw || !def) return null
  return toExternalImageProxyUrl(raw, { publicPathBase: def.proxyPublicBase }) ?? raw
}

export function resolveSiteDefaultImageUrlWithVersion(
  map: NestedDefaultEntries,
  scope: string,
  slot: string
): string | null {
  const def = getSiteDefaultSlotDefinition(scope, slot)
  const entry = getSiteDefaultImageEntry(map, scope, slot)
  if (!entry?.image || !def) {
    return null
  }

  const resolved =
    toExternalImageProxyUrl(entry.image, { publicPathBase: def.proxyPublicBase }) ?? entry.image

  return appendAssetVersion(resolved, entry.updatedAt)
}

export async function getSiteDefaultImageRaw(scope: string, slot: string): Promise<string | null> {
  const row = await db.query.siteDefaultImages.findFirst({
    where: and(eq(siteDefaultImages.scope, scope), eq(siteDefaultImages.slot, slot)),
    columns: { image: true },
  })
  return row?.image ?? null
}
