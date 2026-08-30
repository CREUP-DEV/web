import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  timestamp,
  unique,
  index,
  check,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { cuid } from './common'
import { memberOrgSourceEnum, type AreaNameSnapshot } from './activity'

/**
 * Local, auto-syncing catalogs backing the admin "area" (area-reports) and "member org"
 * (activity organiser) dropdowns. `areaReports.areaId` / `activityEntries.memberOrgId` are
 * untouched by this module — they keep meaning exactly what they meant before these tables
 * existed. Each catalog row's `selectionKey` is the value that gets frozen into those columns;
 * `id` (cuid) is purely this table's own row identity, used by the reusable admin CRUD/reorder
 * helpers. See docs/plan-catalog-sync (or the approved plan) for the full rationale.
 */

/**
 * One row per area *per mandate*, mirroring the org chart's historical endpoint. The upstream
 * `area_id` is unusable as a key — it comes back as 0 for every past mandate — so `selectionKey`
 * holds `area_term_id`, which is unique across the whole history. That is also what gets frozen
 * into `area_reports.areaId`.
 *
 * The mandate dates ride along on each row so the report form can offer the areas that were in
 * force during the month being reported on, and so "current" needs no manual flag: the running
 * mandate is the one with no end date. Nothing here is editable by hand — the org chart is the
 * single source of truth and `catalogSync.ts` overwrites the lot on every read.
 */
export const areaCatalogEntries = pgTable(
  'area_catalog_entries',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    /** `area_term_id` from the org chart; the value written into area_reports.areaId. */
    selectionKey: integer('selection_key').notNull(),
    mandateId: integer('mandate_id').notNull(),
    mandateStartDate: text('mandate_start_date').notNull(),
    /** Null on the running mandate — the only one without an end. */
    mandateEndDate: text('mandate_end_date'),
    nameTranslations: jsonb('name_translations').$type<AreaNameSnapshot>().notNull(),
    order: integer('order').default(0).notNull(),
    /** Mirrors "belongs to the running mandate"; kept as a column so lists can filter cheaply. */
    active: boolean('active').default(true).notNull(),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    unique('area_catalog_entries_selection_key_unique').on(table.selectionKey),
    index('idx_area_catalog_entries_mandate_order').on(table.mandateId, table.order),
    index('idx_area_catalog_entries_active_order').on(table.active, table.order),
  ]
)

export const memberOrgCatalogEntries = pgTable(
  'member_org_catalog_entries',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    source: memberOrgSourceEnum('source').notNull(),
    /** The value written into activityEntries.memberOrgId. Equals sourceKey for synced rows. */
    selectionKey: text('selection_key').notNull(),
    /**
     * Best-effort matching key from the external members feed — a slug DERIVED from mutable
     * display fields (denomination/university/etc.), not a guaranteed-stable upstream id. A
     * rename upstream changes this value, so sync sees a "new" entity rather than recognizing
     * the same one — a known, accepted limitation (see `supersededByEntryId`). Deliberately not
     * named `externalId` to avoid implying it's stable the way the areas catalog's is.
     */
    sourceKey: text('source_key'),
    denomination: text('denomination').notNull(),
    initials: text('initials').notNull(),
    logoLight: text('logo_light'),
    logoDark: text('logo_dark'),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    /** Set by an admin once they notice a stale duplicate caused by an upstream rename. */
    supersededByEntryId: text('superseded_by_entry_id').references(
      (): AnyPgColumn => memberOrgCatalogEntries.id
    ),
    lastSyncedAt: timestamp('last_synced_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    unique('member_org_catalog_entries_source_selection_key_unique').on(
      table.source,
      table.selectionKey
    ),
    unique('member_org_catalog_entries_source_source_key_unique').on(table.source, table.sourceKey),
    index('idx_member_org_catalog_entries_source_active_order').on(
      table.source,
      table.active,
      table.order
    ),
    check(
      'member_org_catalog_entries_selection_key_check',
      sql`(${table.sourceKey} IS NOT NULL AND ${table.selectionKey} = ${table.sourceKey})
        OR (${table.sourceKey} IS NULL AND ${table.selectionKey} LIKE 'manual:%')`
    ),
    // DB-level guard against self-reference only — matching `source` between a row and its
    // superseder is enforced in the PUT handler (a single-row CHECK can't compare two rows).
    check(
      'member_org_catalog_entries_superseded_by_self_check',
      sql`${table.id} != ${table.supersededByEntryId}`
    ),
  ]
)

/** One row per catalog ('area' | 'member-org'), tracking sync health independent of any single
 * row's `lastSyncedAt` — distinguishes "this entity disappeared" from "the source has been down
 * for two days". */
export const catalogSyncState = pgTable(
  'catalog_sync_state',
  {
    catalogKey: text('catalog_key').primaryKey(),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true, mode: 'date' }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true, mode: 'date' }),
    /** Sanitized/truncated for admin display — never the raw upstream error, see catalogSync.ts. */
    lastErrorMessage: text('last_error_message'),
  },
  (table) => [
    check(
      'catalog_sync_state_catalog_key_check',
      sql`${table.catalogKey} in ('area', 'member-org')`
    ),
  ]
)

export const memberOrgCatalogEntriesRelations = relations(memberOrgCatalogEntries, ({ one }) => ({
  supersededBy: one(memberOrgCatalogEntries, {
    fields: [memberOrgCatalogEntries.supersededByEntryId],
    references: [memberOrgCatalogEntries.id],
  }),
}))
