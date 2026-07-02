import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  jsonb,
  timestamp,
  date,
  unique,
  index,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

/**
 * Activity section ("Actividad") — replaces the monthly newsletter with native web entries.
 *
 * Two families live here:
 *  - `activity_entries`: CREUP events and member-organisation events (discriminated by `kind`).
 *  - `area_report_editions` + `area_reports`: the monthly "Informe de áreas", one edition per
 *    month with one report row per area.
 *
 * The non-overlap exclusion constraint on `area_report_editions` and the two generated
 * `*_idx` helper columns it relies on cannot be expressed in Drizzle and are added as raw SQL
 * in the migration (see drizzle/0009_*.sql). They are intentionally absent from BOTH this
 * schema and the drizzle/meta snapshot — keep it that way. `drizzle-kit generate` diffs schema
 * vs snapshot (never the live DB), so as long as both omit these objects every future generate
 * yields an empty diff for them. Hand-adding them to the snapshot would make the two diverge and
 * emit a spurious DROP. (Only `drizzle-kit push`, which we do not use, diffs against the live DB.)
 */

// Enums

export const activityKindEnum = pgEnum('activity_kind', ['creup', 'member'])

export const memberOrgSourceEnum = pgEnum('member_org_source', ['asociado', 'sectorial'])

export type ActivityKind = (typeof activityKindEnum.enumValues)[number]
export type MemberOrgSource = (typeof memberOrgSourceEnum.enumValues)[number]

/** Frozen organiser identity captured from the external lists at publish time. */
export interface MemberOrgSnapshot {
  denomination: string
  initials: string
  logoLight: string | null
  logoDark: string | null
}

/** Frozen `locale -> name` map captured from the org chart at publish time. */
export type AreaNameSnapshot = Record<string, string>

// Activity entries

export const activityEntries = pgTable(
  'activity_entries',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    kind: activityKindEnum('kind').notNull(),
    slug: text('slug').notNull().unique(),
    image: text('image'),
    startDate: date('start_date', { mode: 'string' }).notNull(),
    endDate: date('end_date', { mode: 'string' }),
    isOnline: boolean('is_online').default(false).notNull(),
    location: text('location'),
    // Only set when kind = 'member' (enforced by CHECK):
    memberOrgSource: memberOrgSourceEnum('member_org_source'),
    memberOrgId: text('member_org_id'),
    memberOrgSnapshot: jsonb('member_org_snapshot').$type<MemberOrgSnapshot>(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    index('idx_activity_entries_active_start').on(table.active, table.startDate),
    index('idx_activity_entries_slug_active').on(table.slug, table.active),
    index('idx_activity_entries_kind').on(table.kind),
    // kind <-> organiser invariant: member rows carry the organiser snapshot, CREUP rows do not.
    check(
      'activity_entries_member_org_check',
      sql`(
        ${table.kind} = 'member'
        AND ${table.memberOrgSource} IS NOT NULL
        AND ${table.memberOrgId} IS NOT NULL
        AND ${table.memberOrgSnapshot} IS NOT NULL
      ) OR (
        ${table.kind} = 'creup'
        AND ${table.memberOrgSource} IS NULL
        AND ${table.memberOrgId} IS NULL
        AND ${table.memberOrgSnapshot} IS NULL
      )`
    ),
    // Online entries have no physical location.
    check(
      'activity_entries_online_location_check',
      sql`${table.isOnline} = false OR ${table.location} IS NULL`
    ),
    // Optional date range stays ordered.
    check(
      'activity_entries_date_range_check',
      sql`${table.endDate} IS NULL OR ${table.endDate} >= ${table.startDate}`
    ),
  ]
)

export const activityEntryTranslations = pgTable(
  'activity_entry_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    excerpt: text('excerpt'),
    contentHtml: text('content_html'),
    imageCaption: text('image_caption'),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    activityEntryId: text('activity_entry_id')
      .notNull()
      .references(() => activityEntries.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.activityEntryId),
    check('activity_entry_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_activity_entry_translations_entry_id').on(table.activityEntryId),
    index('idx_activity_entry_translations_title_trgm').using(
      'gin',
      sql`${table.title} gin_trgm_ops`
    ),
    index('idx_activity_entry_translations_excerpt_trgm').using(
      'gin',
      sql`${table.excerpt} gin_trgm_ops`
    ),
  ]
)

// Area reports

export const areaReportEditions = pgTable(
  'area_report_editions',
  {
    /** 'YYYY-MM' — the anchor month (end of the covered range). */
    monthKey: text('month_key').primaryKey(),
    /** 'YYYY-MM' — start of the covered range; null means the edition covers only `monthKey`. */
    coversFrom: text('covers_from'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    check(
      'area_report_editions_month_key_format_check',
      sql`${table.monthKey} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`
    ),
    check(
      'area_report_editions_covers_from_format_check',
      sql`${table.coversFrom} IS NULL OR ${table.coversFrom} ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'`
    ),
    // Lexicographic comparison is valid because both share the zero-padded 'YYYY-MM' format.
    check(
      'area_report_editions_covers_from_range_check',
      sql`${table.coversFrom} IS NULL OR ${table.coversFrom} <= ${table.monthKey}`
    ),
  ]
)

export const areaReports = pgTable(
  'area_reports',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    monthKey: text('month_key')
      .notNull()
      .references(() => areaReportEditions.monthKey, { onDelete: 'cascade' }),
    areaId: integer('area_id').notNull(),
    areaNameSnapshot: jsonb('area_name_snapshot').$type<AreaNameSnapshot>().notNull(),
    areaOrderSnapshot: integer('area_order_snapshot'),
    image: text('image'),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [
    unique('area_reports_month_key_area_id_unique').on(table.monthKey, table.areaId),
    index('idx_area_reports_month_key_active').on(table.monthKey, table.active),
  ]
)

export const areaReportTranslations = pgTable(
  'area_report_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    contentHtml: text('content_html').notNull(),
    imageCaption: text('image_caption'),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    areaReportId: text('area_report_id')
      .notNull()
      .references(() => areaReports.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.areaReportId),
    check('area_report_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_area_report_translations_report_id').on(table.areaReportId),
  ]
)

// Relations

export const activityEntriesRelations = relations(activityEntries, ({ many }) => ({
  translations: many(activityEntryTranslations),
}))

export const activityEntryTranslationsRelations = relations(
  activityEntryTranslations,
  ({ one }) => ({
    activityEntry: one(activityEntries, {
      fields: [activityEntryTranslations.activityEntryId],
      references: [activityEntries.id],
    }),
  })
)

export const areaReportEditionsRelations = relations(areaReportEditions, ({ many }) => ({
  reports: many(areaReports),
}))

export const areaReportsRelations = relations(areaReports, ({ one, many }) => ({
  edition: one(areaReportEditions, {
    fields: [areaReports.monthKey],
    references: [areaReportEditions.monthKey],
  }),
  translations: many(areaReportTranslations),
}))

export const areaReportTranslationsRelations = relations(areaReportTranslations, ({ one }) => ({
  areaReport: one(areaReports, {
    fields: [areaReportTranslations.areaReportId],
    references: [areaReports.id],
  }),
}))
