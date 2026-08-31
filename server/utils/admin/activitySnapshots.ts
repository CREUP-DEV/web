import { and, eq } from 'drizzle-orm'
import type { db } from '../../db'
import { areaCatalogEntries, memberOrgCatalogEntries } from '../../db/schema'
import type { AreaNameSnapshot, MemberOrgSnapshot, MemberOrgSource } from '../../db/schema/activity'

/**
 * Snapshot resolvers, each of which runs *inside* the caller's transaction, behind a `FOR SHARE`
 * lock on the catalog row it reads.
 *
 * The admin client only ever sends a *reference* (an `areaId`, or a `memberOrgSource` + `id`) —
 * both of which are `selectionKey` values in the local catalog tables (server/db/schema/catalog.ts),
 * not a live lookup against the external org-chart/member APIs. The catalog is kept in sync by
 * `catalogSync.ts` on every admin dropdown read, so this never calls the external API itself.
 *
 * Reading the fields under the lock rather than beforehand is what makes the frozen snapshot
 * trustworthy, and the lock does two jobs at once:
 *
 * - It stops a delete from slipping between the read and the insert. There is no foreign key from
 *   the activity tables to the catalog (the catalog imports from the activity schema, so the
 *   reverse reference would be circular), so `FOR SHARE` is the substitute: it is incompatible with
 *   the deleter's `FOR UPDATE`, and whichever commits first makes the other see reality.
 * - It equally excludes a concurrent `UPDATE`, which takes `FOR NO KEY UPDATE`. A logo swap can no
 *   longer land between the fields being read and being frozen, which would otherwise leave the
 *   snapshot pointing at a file the swap then deleted.
 *
 * Deliberately does NOT filter on `active` — the dropdown intentionally offers inactive/historical
 * entries for selection, so a reference should only fail to resolve when the `selectionKey` doesn't
 * exist in the catalog at all, never because the row is inactive. Published rows always render from
 * the frozen snapshot, never re-resolved.
 *
 * Each resolver returns `null` when the reference no longer exists so callers can surface a 4xx.
 */

/** The transaction handle the caller is already inside; a bare `db` would defeat the lock. */
type SnapshotExecutor = Pick<typeof db, 'select'>

export interface AreaSnapshotResult {
  areaNameSnapshot: AreaNameSnapshot
  areaOrderSnapshot: number | null
}

export async function lockAreaCatalogEntry(
  tx: SnapshotExecutor,
  areaId: number
): Promise<AreaSnapshotResult | null> {
  const [entry] = await tx
    .select({
      nameTranslations: areaCatalogEntries.nameTranslations,
      order: areaCatalogEntries.order,
    })
    .from(areaCatalogEntries)
    .where(eq(areaCatalogEntries.selectionKey, areaId))
    .for('share')

  if (!entry) {
    return null
  }

  return { areaNameSnapshot: entry.nameTranslations, areaOrderSnapshot: entry.order }
}

export async function lockMemberOrgCatalogEntry(
  tx: SnapshotExecutor,
  source: MemberOrgSource,
  id: string
): Promise<MemberOrgSnapshot | null> {
  const [entry] = await tx
    .select({
      denomination: memberOrgCatalogEntries.denomination,
      initials: memberOrgCatalogEntries.initials,
      logoLight: memberOrgCatalogEntries.logoLight,
      logoDark: memberOrgCatalogEntries.logoDark,
    })
    .from(memberOrgCatalogEntries)
    .where(
      and(eq(memberOrgCatalogEntries.source, source), eq(memberOrgCatalogEntries.selectionKey, id))
    )
    .for('share')

  return entry ?? null
}
