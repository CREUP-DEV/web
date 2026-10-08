import { and, eq, like, ne, or, sql } from 'drizzle-orm'
import type { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core'
import type { db } from '../../db'
import {
  activityEntries,
  activityEntrySlugHistory,
  pressArticles,
  pressArticleSlugHistory,
} from '../../db/schema'

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
    .replace(/^-|-$/g, '') // Trim again in case the length cut ended on a hyphen
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

type SlugExecutor = Pick<typeof db, 'execute' | 'select'>

/** The transaction a slug change is recorded in: the history row must commit with the new slug. */
type SlugHistoryExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0]

interface GenerateSlugOptions {
  /** The row being updated: its own current and former slugs stay available to it. */
  excludeId?: string
  executor?: SlugExecutor
}

/** Where a family's slugs live: the current one on the row, former ones in its history table. */
interface SlugSource {
  table: PgTable
  slug: AnyPgColumn<{ data: string; notNull: true }>
  ownerId: AnyPgColumn<{ data: string; notNull: true }>
}

const MAX_SLUG_SUFFIX = 100

function buildDatedBaseSlug(title: string, date: Date, fallback: string) {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${slugify(title) || fallback}-${year}-${month}`
}

/** `<title>-<yyyy>-<mm>`: the slug every press article with this title and month competes for. */
export function buildPressBaseSlug(title: string, publishedAt: Date) {
  return buildDatedBaseSlug(title, publishedAt, 'articulo')
}

/** `<title>-<yyyy>-<mm>`: the slug every activity entry with this title and month competes for. */
export function buildActivityBaseSlug(title: string, startDate: Date) {
  return buildDatedBaseSlug(title, startDate, 'actividad')
}

/**
 * POSIX regex (for `~`) matching `baseSlug` and its generated `-N` variants: the slugs a row with
 * the same title and month ends up with, i.e. the likely duplicates of a new one.
 */
export function buildSlugFamilyPattern(baseSlug: string) {
  return `^${baseSlug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(-[0-9]+)?$`
}

/**
 * Serialize slug generation per base slug so concurrent mutations cannot claim the same value
 * between the check and the write. The lock is transaction-scoped, so it is held until the caller
 * commits — which is also what makes a duplicate check run after it race-free.
 */
async function lockBaseSlug(executor: SlugExecutor | undefined, baseSlug: string, caller: string) {
  if (!executor) {
    throw new Error(
      `${caller} requires a transaction executor. Call this function inside db.transaction(...) and pass the tx as options.executor.`
    )
  }

  await executor.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${baseSlug}))`)
  return executor
}

/**
 * Every slug of the `baseSlug` family (`baseSlug` and its `-<anything>` variants) held now or
 * before by a row other than `excludeId`. Slugify output is `[a-z0-9-]`, the fallbacks too, so the
 * base carries no LIKE wildcard to escape.
 */
async function findTakenSlugs(
  executor: SlugExecutor,
  baseSlug: string,
  excludeId: string | undefined,
  sources: SlugSource[]
) {
  const taken = new Set<string>()

  for (const source of sources) {
    const rows = await executor
      .select({ slug: source.slug })
      .from(source.table)
      .where(
        and(
          or(eq(source.slug, baseSlug), like(source.slug, `${baseSlug}-%`)),
          excludeId ? ne(source.ownerId, excludeId) : undefined
        )
      )

    for (const row of rows) {
      taken.add(row.slug)
    }
  }

  return taken
}

function pickFreeSlug(baseSlug: string, taken: Set<string>) {
  if (!taken.has(baseSlug)) {
    return baseSlug
  }

  for (let suffix = 2; suffix <= MAX_SLUG_SUFFIX; suffix++) {
    const candidate = `${baseSlug}-${suffix}`
    if (!taken.has(candidate)) {
      return candidate
    }
  }

  throw new Error(`No free slug left for "${baseSlug}"`)
}

const PRESS_SLUG_SOURCES: SlugSource[] = [
  { table: pressArticles, slug: pressArticles.slug, ownerId: pressArticles.id },
  {
    table: pressArticleSlugHistory,
    slug: pressArticleSlugHistory.slug,
    ownerId: pressArticleSlugHistory.pressArticleId,
  },
]

const ACTIVITY_SLUG_SOURCES: SlugSource[] = [
  { table: activityEntries, slug: activityEntries.slug, ownerId: activityEntries.id },
  {
    table: activityEntrySlugHistory,
    slug: activityEntrySlugHistory.slug,
    ownerId: activityEntrySlugHistory.activityEntryId,
  },
]

/**
 * Derive a press article slug from its Spanish title and publication month: the base slug, or the
 * first `-N` variant no other article holds now or held before. Other articles' former slugs stay
 * reserved so an old link never lands on a different article; the article's own (`excludeId`) are
 * free to reclaim.
 */
export async function generatePressSlug(
  title: string,
  publishedAt: Date,
  options: GenerateSlugOptions = {}
): Promise<string> {
  const baseSlug = buildPressBaseSlug(title, publishedAt)
  const executor = await lockBaseSlug(options.executor, baseSlug, 'generatePressSlug')
  const taken = await findTakenSlugs(executor, baseSlug, options.excludeId, PRESS_SLUG_SOURCES)
  return pickFreeSlug(baseSlug, taken)
}

/**
 * Activity-entry slug generator — same date-anchored, advisory-lock-serialized, history-aware
 * strategy as {@link generatePressSlug}, against `activity_entries`.
 */
export async function generateActivitySlug(
  title: string,
  startDate: Date,
  options: GenerateSlugOptions = {}
): Promise<string> {
  const baseSlug = buildActivityBaseSlug(title, startDate)
  const executor = await lockBaseSlug(options.executor, baseSlug, 'generateActivitySlug')
  const taken = await findTakenSlugs(executor, baseSlug, options.excludeId, ACTIVITY_SLUG_SOURCES)
  return pickFreeSlug(baseSlug, taken)
}

/**
 * Keep a press article's former slug resolving after a save moved it to `nextSlug`, and drop the
 * history row of `nextSlug` when the article reclaims one of its own former slugs. Runs in the
 * save's transaction, after the row update. The upsert hands the former slug to this article
 * should a stale row still name another one: this is the article that held it last.
 */
export async function recordPressSlugChange(
  tx: SlugHistoryExecutor,
  pressArticleId: string,
  previousSlug: string,
  nextSlug: string
) {
  if (previousSlug === nextSlug) {
    return
  }

  await tx
    .delete(pressArticleSlugHistory)
    .where(
      and(
        eq(pressArticleSlugHistory.slug, nextSlug),
        eq(pressArticleSlugHistory.pressArticleId, pressArticleId)
      )
    )
  await tx
    .insert(pressArticleSlugHistory)
    .values({ slug: previousSlug, pressArticleId })
    .onConflictDoUpdate({
      target: pressArticleSlugHistory.slug,
      set: { pressArticleId, createdAt: sql`now()` },
    })
}

/** {@link recordPressSlugChange} for activity entries. */
export async function recordActivitySlugChange(
  tx: SlugHistoryExecutor,
  activityEntryId: string,
  previousSlug: string,
  nextSlug: string
) {
  if (previousSlug === nextSlug) {
    return
  }

  await tx
    .delete(activityEntrySlugHistory)
    .where(
      and(
        eq(activityEntrySlugHistory.slug, nextSlug),
        eq(activityEntrySlugHistory.activityEntryId, activityEntryId)
      )
    )
  await tx
    .insert(activityEntrySlugHistory)
    .values({ slug: previousSlug, activityEntryId })
    .onConflictDoUpdate({
      target: activityEntrySlugHistory.slug,
      set: { activityEntryId, createdAt: sql`now()` },
    })
}
