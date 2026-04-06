import { and, eq, ne, sql } from 'drizzle-orm'
import { db } from '../db'
import { pressArticles } from '../db/schema'

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

type PressSlugExecutor = Pick<typeof db, 'execute' | 'query'>

interface GeneratePressSlugOptions {
  excludeId?: string
  executor?: PressSlugExecutor
}

export async function generatePressSlug(
  title: string,
  publishedAt: Date,
  options: GeneratePressSlugOptions = {}
): Promise<string> {
  const year = publishedAt.getUTCFullYear()
  const month = String(publishedAt.getUTCMonth() + 1).padStart(2, '0')
  const base = slugify(title) || 'articulo'
  const baseSlug = `${base}-${year}-${month}`
  const executor = options.executor ?? db

  // Serialize slug generation per base slug so concurrent mutations cannot
  // claim the same value between the uniqueness check and the write.
  await executor.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${baseSlug}))`)

  let candidate = baseSlug
  let suffix = 2

  while (true) {
    const whereClause = options.excludeId
      ? and(eq(pressArticles.slug, candidate), ne(pressArticles.id, options.excludeId))
      : eq(pressArticles.slug, candidate)

    const existing = await executor.query.pressArticles.findFirst({
      where: whereClause,
    })

    if (!existing) {
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
