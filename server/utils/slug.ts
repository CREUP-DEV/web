/**
 * Slug generation utilities for press articles
 * Generates URL-friendly slugs from titles with year-month suffix to reduce collisions
 */

import { eq } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles } from '../db/schema'

/**
 * Convert a string to a URL-friendly slug
 * Handles Spanish characters (tildes, ñ, etc.)
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-|-$/g, '') // Trim leading/trailing hyphens
    .slice(0, 60) // Limit length
}

export function buildReadableFileSlug(title: string, date?: Date | string | null): string {
  const safeTitle = slugify(title) || 'documento'

  if (!date) {
    return safeTitle
  }

  const parsedDate = date instanceof Date ? date : new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return safeTitle
  }

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${safeTitle}-${year}-${month}-${day}`.slice(0, 90)
}

export function buildReadableFileSlugWithFallback(
  title: string,
  date?: Date | string | null,
  suffix?: string | number | null
): string {
  let candidate = buildReadableFileSlug(title)

  if (date) {
    const datedCandidate = buildReadableFileSlug(title, date)
    if (datedCandidate !== candidate) {
      candidate = datedCandidate
    }
  }

  if (suffix !== null && suffix !== undefined && suffix !== '') {
    return `${candidate}-${suffix}`.slice(0, 100)
  }

  return candidate
}

/**
 * Generate a unique slug for a press article
 * Format: `slugified-title-YYYY-MM`
 * If collision occurs, appends a numeric suffix: `-2`, `-3`, etc.
 *
 * @param title - The article title (typically in Spanish)
 * @param publishedAt - The publication date
 * @param excludeId - Optional article ID to exclude from collision check (for updates)
 */
export async function generatePressSlug(
  title: string,
  publishedAt: Date,
  excludeId?: string
): Promise<string> {
  const year = publishedAt.getFullYear()
  const month = String(publishedAt.getMonth() + 1).padStart(2, '0')
  const base = slugify(title)
  const baseSlug = `${base}-${year}-${month}`

  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const existing = await db.query.pressArticles.findFirst({
      where: eq(pressArticles.slug, candidate),
    })

    // No collision, or the collision is the same article being updated
    if (!existing || (excludeId && existing.id === excludeId)) {
      return candidate
    }

    candidate = `${baseSlug}-${suffix}`
    suffix++

    // Safety limit to prevent infinite loops
    if (suffix > 100) {
      throw new Error('No se pudo generar un slug único')
    }
  }
}
