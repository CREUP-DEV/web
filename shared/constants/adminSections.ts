import { ADMIN_ROUTES } from './adminRoutes'

export type AdminSectionKey =
  | 'access'
  | 'stats'
  | 'carousel'
  | 'about'
  | 'equality'
  | 'newsletter'
  | 'press'
  | 'siteDefaultImages'
  | 'links'
  | 'tags'
  | 'media'
  | 'financialReports'
  | 'activity'

export type AdminSubsectionKey =
  | 'activityEntries'
  | 'areaReports'
  | 'memberOrgCatalog'
  | 'areaCatalog'
  | 'newsletterCampaigns'
  | 'newsletterSubscribers'

/** The labelled groups of the admin sidebar, in the order they show. */
export type AdminNavGroupKey = 'content' | 'site' | 'catalogs' | 'system'

export const ADMIN_NAV_GROUPS: readonly AdminNavGroupKey[] = [
  'content',
  'site',
  'catalogs',
  'system',
]

export interface AdminSubsectionDefinition {
  key: AdminSubsectionKey
  to: string
  icon: string
}

/**
 * One admin section: its sidebar entry, its card on the dashboard and the first level of the
 * breadcrumb trail of every page under `to`. Names and descriptions are i18n keys
 * (`admin.nav.<key>.name` / `.description`), never literals here.
 *
 * `children` are the section's own pages, listed under it in the sidebar; the first one is the
 * section's landing page and shares its `to`.
 */
export interface AdminSectionDefinition {
  key: AdminSectionKey
  group: AdminNavGroupKey
  to: string
  icon: string
  /** Only shown to the admins listed in `NUXT_ADMIN_EMAILS`; the server enforces it too. */
  envOnly?: boolean
  children?: AdminSubsectionDefinition[]
}

/** Ordered by group, then by how often each section is used. */
export const ADMIN_SECTION_DEFINITIONS: AdminSectionDefinition[] = [
  {
    key: 'press',
    group: 'content',
    to: ADMIN_ROUTES.press,
    icon: 'i-tabler-news',
  },
  {
    key: 'activity',
    group: 'content',
    to: ADMIN_ROUTES.activity,
    icon: 'i-tabler-calendar-event',
    children: [
      { key: 'activityEntries', to: ADMIN_ROUTES.activity, icon: 'i-tabler-list-details' },
      { key: 'areaReports', to: ADMIN_ROUTES.activityReports, icon: 'i-tabler-report' },
      {
        key: 'memberOrgCatalog',
        to: ADMIN_ROUTES.memberOrgCatalog,
        icon: 'i-tabler-building-community',
      },
      { key: 'areaCatalog', to: ADMIN_ROUTES.areaCatalog, icon: 'i-tabler-category' },
    ],
  },
  {
    key: 'newsletter',
    group: 'content',
    to: ADMIN_ROUTES.newsletter,
    icon: 'i-tabler-mail',
    children: [
      { key: 'newsletterCampaigns', to: ADMIN_ROUTES.newsletter, icon: 'i-tabler-send' },
      {
        key: 'newsletterSubscribers',
        to: ADMIN_ROUTES.newsletterSubscribers,
        icon: 'i-tabler-users',
      },
    ],
  },
  {
    key: 'carousel',
    group: 'site',
    to: ADMIN_ROUTES.carousel,
    icon: 'i-tabler-photo',
  },
  {
    key: 'links',
    group: 'site',
    to: ADMIN_ROUTES.links,
    icon: 'i-tabler-link',
  },
  {
    key: 'about',
    group: 'site',
    to: ADMIN_ROUTES.about,
    icon: 'i-tabler-info-circle',
  },
  {
    key: 'equality',
    group: 'site',
    to: ADMIN_ROUTES.equality,
    icon: 'i-tabler-scale',
  },
  {
    key: 'financialReports',
    group: 'site',
    to: ADMIN_ROUTES.financialReports,
    icon: 'i-tabler-file-analytics',
  },
  {
    key: 'tags',
    group: 'catalogs',
    to: ADMIN_ROUTES.tags,
    icon: 'i-tabler-tags',
  },
  {
    key: 'media',
    group: 'catalogs',
    to: ADMIN_ROUTES.media,
    icon: 'i-tabler-broadcast',
  },
  {
    key: 'siteDefaultImages',
    group: 'catalogs',
    to: ADMIN_ROUTES.siteDefaultImages,
    icon: 'i-tabler-photo-scan',
  },
  {
    key: 'access',
    group: 'system',
    to: ADMIN_ROUTES.access,
    icon: 'i-tabler-shield-lock',
    envOnly: true,
  },
  {
    key: 'stats',
    group: 'system',
    to: ADMIN_ROUTES.stats,
    icon: 'i-tabler-activity-heartbeat',
    envOnly: true,
  },
]
