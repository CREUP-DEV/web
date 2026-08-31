import { sql } from 'drizzle-orm'
import { db } from '../../db'
import {
  aboutPageContent,
  activityEntries,
  areaReports,
  carouselItems,
  equalityDocuments,
  featuredLinks,
  financialReports,
  mediaOutlets,
  memberOrgCatalogEntries,
  newsletters,
  pressArticles,
  pressDossier,
  siteDefaultImages,
  users,
} from '../../db/schema'

// Registry of every table/column that stores admin-managed files.
// To register a new asset field: add one entry here — nothing else needs updating.
// Using `any` to allow a uniform registry across table-specific Drizzle column types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ASSET_COLUMN_REGISTRY: Array<{ table: any; column: any }> = [
  { table: aboutPageContent, column: aboutPageContent.heroImage },
  { table: activityEntries, column: activityEntries.image },
  { table: areaReports, column: areaReports.image },
  { table: carouselItems, column: carouselItems.image },
  { table: equalityDocuments, column: equalityDocuments.pdfUrl },
  { table: featuredLinks, column: featuredLinks.image },
  { table: financialReports, column: financialReports.pdfUrl },
  { table: mediaOutlets, column: mediaOutlets.logo },
  { table: memberOrgCatalogEntries, column: memberOrgCatalogEntries.logoLight },
  { table: memberOrgCatalogEntries, column: memberOrgCatalogEntries.logoDark },
  { table: newsletters, column: newsletters.coverImage },
  { table: newsletters, column: newsletters.pdfUrl },
  { table: pressArticles, column: pressArticles.image },
  { table: pressArticles, column: pressArticles.pdfUrl },
  { table: pressDossier, column: pressDossier.pdfUrl },
  { table: siteDefaultImages, column: siteDefaultImages.image },
  { table: users, column: users.image },
]

// Files referenced only from inside a JSONB snapshot. A published activity freezes the organiser's
// logos at publish time, so the catalog row can be edited or deleted while the historical entry
// still renders that exact file — deleting it would break the public page.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ASSET_JSON_REGISTRY: Array<{ table: any; column: any; key: string }> = [
  { table: activityEntries, column: activityEntries.memberOrgSnapshot, key: 'logoLight' },
  { table: activityEntries, column: activityEntries.memberOrgSnapshot, key: 'logoDark' },
]

export async function hasAdminStoredFileReference(storagePath: string): Promise<boolean> {
  const normalizedStoragePath = storagePath.trim()

  if (!normalizedStoragePath) {
    return false
  }

  const unionParts = [
    ...ASSET_COLUMN_REGISTRY.map(
      ({ table, column }) => sql`SELECT 1 FROM ${table} WHERE ${column} = ${normalizedStoragePath}`
    ),
    ...ASSET_JSON_REGISTRY.map(
      ({ table, column, key }) =>
        sql`SELECT 1 FROM ${table} WHERE ${column}->>${key} = ${normalizedStoragePath}`
    ),
  ]
  const unionAll = unionParts
    .slice(1)
    .reduce(
      (acc: ReturnType<typeof sql>, part: ReturnType<typeof sql>) => sql`${acc} UNION ALL ${part}`,
      unionParts[0]!
    )
  const result = await db.execute<{ found: boolean }>(sql`SELECT EXISTS (${unionAll}) AS found`)
  return Boolean(result.rows[0]?.found)
}
