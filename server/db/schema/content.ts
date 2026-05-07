import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  unique,
  index,
  check,
  jsonb,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'
import { buildSupportedLocaleCheck, cuid } from './common'

// Carousel items

export const carouselItems = pgTable(
  'carousel_items',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    /** Nullable when the slide uses the configured site default carousel image. */
    image: text('image'),
    href: text('href').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_carousel_items_active_order').on(table.active, table.order)]
)

export const carouselItemTranslations = pgTable(
  'carousel_item_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    buttonText: text('button_text').notNull(),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    carouselItemId: text('carousel_item_id')
      .notNull()
      .references(() => carouselItems.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.carouselItemId),
    check('carousel_item_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_carousel_item_translations_item_id').on(table.carouselItemId),
  ]
)

// Carousel relations
export const carouselItemsRelations = relations(carouselItems, ({ many }) => ({
  translations: many(carouselItemTranslations),
}))

export const carouselItemTranslationsRelations = relations(carouselItemTranslations, ({ one }) => ({
  carouselItem: one(carouselItems, {
    fields: [carouselItemTranslations.carouselItemId],
    references: [carouselItems.id],
  }),
}))

// Featured links

export const featuredLinks = pgTable(
  'featured_links',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    image: text('image').notNull(),
    to: text('to').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_featured_links_active_order').on(table.active, table.order)]
)

export const featuredLinkTranslations = pgTable(
  'featured_link_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    alt: text('alt'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    featuredLinkId: text('featured_link_id')
      .notNull()
      .references(() => featuredLinks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.featuredLinkId),
    check('featured_link_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_featured_link_translations_link_id').on(table.featuredLinkId),
  ]
)

// Featured Links relations
export const featuredLinksRelations = relations(featuredLinks, ({ many }) => ({
  translations: many(featuredLinkTranslations),
}))

export const featuredLinkTranslationsRelations = relations(featuredLinkTranslations, ({ one }) => ({
  featuredLink: one(featuredLinks, {
    fields: [featuredLinkTranslations.featuredLinkId],
    references: [featuredLinks.id],
  }),
}))

// Team areas

export const teamAreas = pgTable('team_areas', {
  id: text('id').primaryKey().$defaultFn(cuid),
  slug: text('slug').notNull().unique(),
  order: integer('order').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`now()`),
})

export const teamAreaTranslations = pgTable(
  'team_area_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    teamAreaId: text('team_area_id')
      .notNull()
      .references(() => teamAreas.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.teamAreaId),
    check('team_area_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_team_area_translations_area_id').on(table.teamAreaId),
  ]
)

// Team Areas relations
export const teamAreasRelations = relations(teamAreas, ({ many }) => ({
  translations: many(teamAreaTranslations),
  members: many(teamMembers),
}))

export const teamAreaTranslationsRelations = relations(teamAreaTranslations, ({ one }) => ({
  teamArea: one(teamAreas, {
    fields: [teamAreaTranslations.teamAreaId],
    references: [teamAreas.id],
  }),
}))

// Team members

export const teamMembers = pgTable(
  'team_members',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    slug: text('slug').notNull().unique(),
    email: text('email').notNull(),
    photo: text('photo'),
    calendarId: text('calendar_id'),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    teamAreaId: text('team_area_id')
      .notNull()
      .references(() => teamAreas.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_team_members_team_area_id').on(table.teamAreaId)]
)

export const teamMemberTranslations = pgTable(
  'team_member_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    title: text('title').notNull(),
    fullName: text('full_name').notNull(),
    university: text('university'),
    degree: text('degree'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    teamMemberId: text('team_member_id')
      .notNull()
      .references(() => teamMembers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique().on(table.locale, table.teamMemberId),
    check('team_member_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_team_member_translations_member_id').on(table.teamMemberId),
  ]
)

// Team Members relations
export const teamMembersRelations = relations(teamMembers, ({ one, many }) => ({
  teamArea: one(teamAreas, {
    fields: [teamMembers.teamAreaId],
    references: [teamAreas.id],
  }),
  translations: many(teamMemberTranslations),
}))

export const teamMemberTranslationsRelations = relations(teamMemberTranslations, ({ one }) => ({
  teamMember: one(teamMembers, {
    fields: [teamMemberTranslations.teamMemberId],
    references: [teamMembers.id],
  }),
}))

// Organization members

export type OrganizationMemberSocial = { network: string; value: string }

export const organizationMembers = pgTable(
  'organization_members',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    slug: text('slug').notNull().unique(),
    logo: text('logo'),
    website: text('website'),
    email: text('email'),
    /** App-level Zod validation enforces { network: string, value: string } per entry. */
    socials: jsonb('socials').$type<OrganizationMemberSocial[]>().default([]).notNull(),
    autonomousCommunity: text('autonomous_community').notNull(),
    order: integer('order').default(0).notNull(),
    active: boolean('active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
  },
  (table) => [index('idx_organization_members_active_order').on(table.active, table.order)]
)

export const organizationMemberTranslations = pgTable(
  'organization_member_translations',
  {
    id: text('id').primaryKey().$defaultFn(cuid),
    locale: text('locale').notNull(),
    name: text('name').notNull(),
    university: text('university').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull()
      .$onUpdate(() => sql`now()`),
    organizationMemberId: text('organization_member_id')
      .notNull()
      .references(() => organizationMembers.id, { onDelete: 'cascade' }),
  },
  (table) => [
    unique('organization_member_translations_locale_member_unique').on(
      table.locale,
      table.organizationMemberId
    ),
    check('organization_member_translations_locale_check', buildSupportedLocaleCheck(table.locale)),
    index('idx_organization_member_translations_member_id').on(table.organizationMemberId),
  ]
)

// Organization Members relations
export const organizationMembersRelations = relations(organizationMembers, ({ many }) => ({
  translations: many(organizationMemberTranslations),
}))

export const organizationMemberTranslationsRelations = relations(
  organizationMemberTranslations,
  ({ one }) => ({
    organizationMember: one(organizationMembers, {
      fields: [organizationMemberTranslations.organizationMemberId],
      references: [organizationMembers.id],
    }),
  })
)
