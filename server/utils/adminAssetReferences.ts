import { eq } from 'drizzle-orm'
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
  teamMembers,
  users,
} from '../db/schema'

// Keep this list in sync with every table/column that stores admin-managed files:
// about_page_content.hero_image, carousel_items.image, equality_documents.pdf_url,
// featured_links.image, financial_reports.pdf_url, media_outlets.logo,
// newsletters.cover_image, newsletters.pdf_url, organization_members.logo,
// press_articles.image, press_articles.pdf_url, press_dossier.pdf_url,
// team_members.photo, users.image.
export async function hasAdminStoredFileReference(storagePath: string) {
  const normalizedStoragePath = storagePath.trim()

  if (!normalizedStoragePath) {
    return false
  }

  const references = await Promise.all([
    db.query.carouselItems.findFirst({
      where: eq(carouselItems.image, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.pressArticles.findFirst({
      where: eq(pressArticles.image, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.pressArticles.findFirst({
      where: eq(pressArticles.pdfUrl, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.pressDossier.findFirst({
      where: eq(pressDossier.pdfUrl, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.featuredLinks.findFirst({
      where: eq(featuredLinks.image, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.users.findFirst({
      where: eq(users.image, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.teamMembers.findFirst({
      where: eq(teamMembers.photo, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.organizationMembers.findFirst({
      where: eq(organizationMembers.logo, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.newsletters.findFirst({
      where: eq(newsletters.coverImage, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.newsletters.findFirst({
      where: eq(newsletters.pdfUrl, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.mediaOutlets.findFirst({
      where: eq(mediaOutlets.logo, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.aboutPageContent.findFirst({
      where: eq(aboutPageContent.heroImage, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.equalityDocuments.findFirst({
      where: eq(equalityDocuments.pdfUrl, normalizedStoragePath),
      columns: { id: true },
    }),
    db.query.financialReports.findFirst({
      where: eq(financialReports.pdfUrl, normalizedStoragePath),
      columns: { id: true },
    }),
  ])

  return references.some(Boolean)
}
