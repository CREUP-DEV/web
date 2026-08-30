import { and, eq } from 'drizzle-orm'
import { db } from '../../db'
import { areaCatalogEntries, memberOrgCatalogEntries } from '../../db/schema'
import type { AreaNameSnapshot, MemberOrgSnapshot, MemberOrgSource } from '../../db/schema/activity'

/**
 * Snapshot resolvers. The admin client only ever sends a *reference* (an `areaId`, or a
 * `memberOrgSource` + `id`) — both of which are `selectionKey` values in the local catalog
 * tables (server/db/schema/catalog.ts), not a live lookup against the external org-chart/member
 * APIs. The catalog is kept in sync by `catalogSync.ts` on every admin dropdown read, so this
 * never calls the external API itself. Deliberately does NOT filter on `active` — the dropdown
 * intentionally offers inactive/historical entries for selection, so a reference should only fail
 * to resolve when the `selectionKey` doesn't exist in the catalog at all, never because the row
 * is inactive. Published rows always render from the frozen snapshot, never re-resolved.
 *
 * Each resolver returns `null` when the reference no longer exists so callers can surface a 4xx.
 */

export interface AreaSnapshotResult {
  areaId: number
  areaNameSnapshot: AreaNameSnapshot
  areaOrderSnapshot: number | null
}

export async function resolveAreaSnapshot(areaId: number): Promise<AreaSnapshotResult | null> {
  const entry = await db.query.areaCatalogEntries.findFirst({
    where: eq(areaCatalogEntries.selectionKey, areaId),
  })
  if (!entry) {
    return null
  }

  return {
    areaId: entry.selectionKey,
    areaNameSnapshot: entry.nameTranslations,
    areaOrderSnapshot: entry.order,
  }
}

export interface MemberOrgSnapshotResult {
  memberOrgSource: MemberOrgSource
  memberOrgId: string
  memberOrgSnapshot: MemberOrgSnapshot
}

export async function resolveMemberOrgSnapshot(
  source: MemberOrgSource,
  id: string
): Promise<MemberOrgSnapshotResult | null> {
  const entry = await db.query.memberOrgCatalogEntries.findFirst({
    where: and(
      eq(memberOrgCatalogEntries.source, source),
      eq(memberOrgCatalogEntries.selectionKey, id)
    ),
  })
  if (!entry) {
    return null
  }

  return {
    memberOrgSource: source,
    memberOrgId: entry.selectionKey,
    memberOrgSnapshot: {
      denomination: entry.denomination,
      initials: entry.initials,
      logoLight: entry.logoLight,
      logoDark: entry.logoDark,
    },
  }
}
