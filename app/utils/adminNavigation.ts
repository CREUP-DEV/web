import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/constants/locales'
import {
  ADMIN_SECTION_DEFINITIONS,
  type AdminSectionDefinition,
  type AdminSubsectionDefinition,
} from '~~/shared/constants/adminSections'

const localePrefixes = new Set<string>(
  SUPPORTED_LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE_CODE)
)

/**
 * Strip a leading non-default locale segment so `/admin/...` and `/en/admin/...` read the same.
 * Admin routes are localized with `prefix_except_default`, so every check on an admin path goes
 * through this first.
 */
export function toCanonicalAdminPath(path: string): string {
  const [, firstSegment, ...rest] = path.split('/')
  if (firstSegment && localePrefixes.has(firstSegment.toLowerCase())) {
    const stripped = `/${rest.join('/')}`
    return stripped === '/' ? '/' : stripped
  }
  return path
}

function normalizePath(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path
}

function isWithinPath(path: string, target: string): boolean {
  return path === target || path.startsWith(`${target}/`)
}

export interface AdminNavMatch {
  section: AdminSectionDefinition
  /** The section's own page the path is in, when the section has `children`. */
  child?: AdminSubsectionDefinition
}

/**
 * The section (and sub-page) a canonical admin path belongs to: the entry with the longest `to`
 * the path is within. A child that shares its section's `to` (the landing page) wins the tie, so
 * `/admin/actividad/<id>` is under «Entradas» while `/admin/actividad/informes/<id>` is under
 * «Informes de áreas». The dashboard (`/admin`) belongs to no section.
 */
export function matchAdminSection(
  canonicalPath: string,
  sections: readonly AdminSectionDefinition[] = ADMIN_SECTION_DEFINITIONS
): AdminNavMatch | null {
  const path = normalizePath(canonicalPath)
  let best: AdminNavMatch | null = null
  let bestLength = -1

  for (const section of sections) {
    if (!isWithinPath(path, section.to)) continue
    if (section.to.length > bestLength) {
      best = { section }
      bestLength = section.to.length
    }
    for (const child of section.children ?? []) {
      if (isWithinPath(path, child.to) && child.to.length >= bestLength) {
        best = { section, child }
        bestLength = child.to.length
      }
    }
  }

  return best
}

export interface AdminCrumb {
  labelKey: string
  /** Canonical path; wrap it in `localePath` before linking. */
  to: string
}

/**
 * The levels above the page at `canonicalPath`, outermost first: its section and, inside a
 * section with sub-pages, the sub-page. Levels that are the page itself are left out, so a
 * section's landing page has none and gets no breadcrumb row (its navbar already names it).
 */
export function adminBreadcrumbAncestors(canonicalPath: string): AdminCrumb[] {
  const match = matchAdminSection(canonicalPath)
  if (!match) return []

  const path = normalizePath(canonicalPath)
  const levels: AdminCrumb[] = [
    { labelKey: `admin.nav.${match.section.key}.name`, to: match.section.to },
  ]
  if (match.child && match.child.to !== match.section.to) {
    levels.push({ labelKey: `admin.nav.${match.child.key}.name`, to: match.child.to })
  }

  return levels.filter((level) => normalizePath(level.to) !== path)
}
