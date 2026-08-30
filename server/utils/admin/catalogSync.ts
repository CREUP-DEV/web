import type { H3Event } from 'h3'
import { and, eq, notExists, notInArray, sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  areaCatalogEntries,
  areaReports,
  catalogSyncState,
  memberOrgCatalogEntries,
} from '../../db/schema'
import type { AreaNameSnapshot, MemberOrgSource } from '../../db/schema/activity'
import { logError } from '../core/logger'
import { getAssociatedMembersResponse, getSectorialesResponse } from '../public/publicMembers'
import { fetchMandateDetail, fetchMandatesList } from '../external/mandateDetail'
import { getExternalApiCacheOptions } from '../cache/externalApiCache'
import { getRequiredExternalApiBaseUrl } from '../core/runtimeConfig'

const MAX_SANITIZED_ERROR_LENGTH = 200

/** Never store a raw upstream error verbatim — it may embed a URL, token, or config value that
 * ends up rendered in an admin-facing sync-health banner. The full error is still logged. */
function sanitizeErrorMessage(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error)
  const redacted = raw
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/\b(authorization|bearer|token|api[_-]?key)\b\S*/gi, '[redacted]')
  return redacted.length > MAX_SANITIZED_ERROR_LENGTH
    ? `${redacted.slice(0, MAX_SANITIZED_ERROR_LENGTH)}…`
    : redacted
}

/**
 * Shared try/catch + sync-health bookkeeping around a catalog's own fetch-then-upsert routine. A
 * sync failure must never fail the caller's request — it's swallowed here after being logged and
 * recorded in `catalogSyncState`, so the dropdown/list endpoint always falls through to serving
 * whatever's already in the local table.
 */
async function runCatalogSync(
  catalogKey: 'area' | 'member-org',
  scope: string,
  sync: () => Promise<void>
) {
  try {
    await sync()
    await db
      .insert(catalogSyncState)
      .values({
        catalogKey,
        lastSuccessAt: new Date(),
        lastFailureAt: null,
        lastErrorMessage: null,
      })
      .onConflictDoUpdate({
        target: catalogSyncState.catalogKey,
        set: { lastSuccessAt: new Date(), lastFailureAt: null, lastErrorMessage: null },
      })
  } catch (error) {
    logError(scope, error)
    // This bookkeeping write must never propagate either — a caller's request must fall through
    // to serving the local catalog even if the DB is unhealthy enough that this write also fails
    // (e.g. a write-outage/read-replica-failover, the exact scenario this local catalog exists to
    // survive). Any failure here is logged and otherwise swallowed.
    try {
      const lastErrorMessage = sanitizeErrorMessage(error)
      await db
        .insert(catalogSyncState)
        .values({ catalogKey, lastFailureAt: new Date(), lastErrorMessage })
        .onConflictDoUpdate({
          target: catalogSyncState.catalogKey,
          set: { lastFailureAt: new Date(), lastErrorMessage },
        })
    } catch (bookkeepingError) {
      logError(scope, bookkeepingError)
    }
  }
}

export async function getCatalogSyncState(catalogKey: 'area' | 'member-org') {
  return db.query.catalogSyncState.findFirst({ where: eq(catalogSyncState.catalogKey, catalogKey) })
}

/**
 * Mirror the org chart's whole mandate history into the local area catalog.
 *
 * Every mandate is walked, not just the running one, because a report is written against the areas
 * that existed in its month — an area retired two mandates ago still has to be offered when editing
 * an old report. Unlike the member-org catalog, rows are overwritten on every sync: the org chart
 * is the sole source of truth here, so there is no local edit worth protecting, and a rename or a
 * reordering upstream should simply land.
 */
export async function syncAreaCatalog(event: H3Event) {
  await runCatalogSync('area', 'admin.area-catalog.sync', async () => {
    const externalBaseUrl = getRequiredExternalApiBaseUrl(event)
    const cacheOptions = getExternalApiCacheOptions(event)
    const mandates = await fetchMandatesList(externalBaseUrl, cacheOptions, event)

    const details = await Promise.all(
      mandates.map((mandate) =>
        fetchMandateDetail(externalBaseUrl, mandate.id, cacheOptions, event)
      )
    )

    const seenSelectionKeys: number[] = []

    for (const detail of details) {
      const { mandate } = detail

      for (const area of detail.areas) {
        seenSelectionKeys.push(area.areaTermId)

        const values = {
          selectionKey: area.areaTermId,
          mandateId: mandate.id,
          mandateStartDate: mandate.startDate,
          mandateEndDate: mandate.endDate,
          nameTranslations: area.nameTranslations as AreaNameSnapshot,
          order: area.order,
          active: mandate.endDate === null,
          lastSyncedAt: sql`now()`,
        }

        await db.insert(areaCatalogEntries).values(values).onConflictDoUpdate({
          target: areaCatalogEntries.selectionKey,
          set: values,
        })
      }
    }

    // An area term the org chart no longer lists is dropped, unless a report still points at it:
    // published reports render from their own frozen snapshot, but the reference has to keep
    // resolving so the entry stays selectable when that report is edited.
    if (seenSelectionKeys.length > 0) {
      await db
        .delete(areaCatalogEntries)
        .where(
          and(
            notInArray(areaCatalogEntries.selectionKey, seenSelectionKeys),
            notExists(
              db
                .select({ id: areaReports.id })
                .from(areaReports)
                .where(eq(areaReports.areaId, areaCatalogEntries.selectionKey))
            )
          )
        )
    }
  })
}

/** Fetch the live associated-members + sectoriales feeds and upsert them into the local catalog,
 * tagged by `source`. `sourceKey` is a slug DERIVED from mutable display fields (see catalog.ts) —
 * not a stable id, so a rename upstream inserts a new row rather than updating the old one; that's
 * an accepted limitation, not a bug here. An item whose slug degenerates to an empty string is
 * skipped entirely (never synced, never selectable) rather than risking a bogus/colliding row. */
export async function syncMemberOrgCatalog(event: H3Event) {
  await runCatalogSync('member-org', 'admin.member-org-catalog.sync', async () => {
    const [{ members }, { sectoriales }] = await Promise.all([
      getAssociatedMembersResponse(event),
      getSectorialesResponse(event),
    ])

    const items: Array<{
      source: MemberOrgSource
      sourceKey: string
      denomination: string
      initials: string
      logoLight: string | null
      logoDark: string | null
      order: number
    }> = [
      ...members.map((member) => ({
        source: 'asociado' as const,
        sourceKey: member.id,
        denomination: member.denomination,
        initials: member.initials,
        logoLight: member.logoLight,
        logoDark: member.logoDark,
        order: member.order,
      })),
      ...sectoriales.map((sectorial) => ({
        source: 'sectorial' as const,
        sourceKey: sectorial.id,
        denomination: sectorial.denomination,
        initials: sectorial.initials,
        logoLight: sectorial.logoLight,
        logoDark: sectorial.logoDark,
        order: sectorial.order,
      })),
    ]

    for (const item of items) {
      if (!item.sourceKey) {
        logError('admin.member-org-catalog.sync', new Error('Skipped item with empty sourceKey'), {
          source: item.source,
          denomination: item.denomination,
        })
        continue
      }

      await db
        .insert(memberOrgCatalogEntries)
        .values({
          source: item.source,
          selectionKey: item.sourceKey,
          sourceKey: item.sourceKey,
          denomination: item.denomination,
          initials: item.initials,
          logoLight: item.logoLight,
          logoDark: item.logoDark,
          order: item.order,
          active: true,
          lastSyncedAt: sql`now()`,
        })
        .onConflictDoUpdate({
          target: [memberOrgCatalogEntries.source, memberOrgCatalogEntries.sourceKey],
          set: { lastSyncedAt: sql`now()` },
        })
    }
  })
}
