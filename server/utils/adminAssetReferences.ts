import { sql } from 'drizzle-orm'
import { db } from '../db'
import {
  aboutPageContent,
  carouselItems,
  equalityDocuments,
  featuredLinks,
  financialReports,
  mediaOutlets,
  newsletters,
  organizationMembers,
  pressArticles,
  pressDossier,
  siteDefaultImages,
  teamMembers,
  users,
} from '../db/schema'

// Registry of every table/column that stores admin-managed files.
// To register a new asset field: add one entry here — nothing else needs updating.
// Using `any` to allow a uniform registry across table-specific Drizzle column types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ASSET_COLUMN_REGISTRY: Array<{ table: any; column: any }> = [
  { table: aboutPageContent, column: aboutPageContent.heroImage },
  { table: carouselItems, column: carouselItems.image },
  { table: equalityDocuments, column: equalityDocuments.pdfUrl },
  { table: featuredLinks, column: featuredLinks.image },
  { table: financialReports, column: financialReports.pdfUrl },
  { table: mediaOutlets, column: mediaOutlets.logo },
  { table: newsletters, column: newsletters.coverImage },
  { table: newsletters, column: newsletters.pdfUrl },
  { table: organizationMembers, column: organizationMembers.logo },
  { table: pressArticles, column: pressArticles.image },
  { table: pressArticles, column: pressArticles.pdfUrl },
  { table: pressDossier, column: pressDossier.pdfUrl },
  { table: siteDefaultImages, column: siteDefaultImages.image },
  { table: teamMembers, column: teamMembers.photo },
  { table: users, column: users.image },
]

export async function hasAdminStoredFileReference(storagePath: string): Promise<boolean> {
  const normalizedStoragePath = storagePath.trim()

  if (!normalizedStoragePath) {
    return false
  }

  const unionParts = ASSET_COLUMN_REGISTRY.map(
    ({ table, column }) => sql`SELECT 1 FROM ${table} WHERE ${column} = ${normalizedStoragePath}`
  )
  const unionAll = unionParts
    .slice(1)
    .reduce(
      (acc: ReturnType<typeof sql>, part: ReturnType<typeof sql>) => sql`${acc} UNION ALL ${part}`,
      unionParts[0]!
    )
  const result = await db.execute<{ found: boolean }>(sql`SELECT EXISTS (${unionAll}) AS found`)
  return Boolean(result[0]?.found)
}
