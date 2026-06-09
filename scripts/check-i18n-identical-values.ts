#!/usr/bin/env tsx
/**
 * Reports leaf strings that are identical between the base and target locale.
 * Allowlisted keys are treated as intentional matches; the rest are review candidates.
 *
 * Usage: tsx scripts/check-i18n-identical-values.ts
 */
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = resolve(__dirname, '../i18n/locales')
const BASE_LOCALE = 'es.json'
// Target locale is overridable: `tsx scripts/check-i18n-identical-values.ts ca.json`.
// Defaults to en.json. The allowlist below is tuned for es/en; for other locales the
// report is advisory (cognates such as "total" or proper nouns produce expected matches).
const TARGET_LOCALE = process.argv[2] ?? 'en.json'

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

type IdenticalMatch = {
  key: string
  value: string
}

type AllowlistEntry = {
  pattern: RegExp
  reason: string
}

const ALLOWLIST: AllowlistEntry[] = [
  { pattern: /^nav\.press\.newsletter$/, reason: 'Brand term kept in English in both locales.' },
  {
    pattern: /^newsletterPage\.(seo\.)?title$/,
    reason: 'Newsletter stays as a branded section name.',
  },
  { pattern: /^social\.[^.]+$/, reason: 'Social network names are proper labels.' },
  { pattern: /^nuxtSiteConfig\.name$/, reason: 'Site name is a brand name.' },
  { pattern: /^members\.networks\.[^.]+$/, reason: 'Third-party social network labels.' },
  { pattern: /^members\.communities\.[^.]+$/, reason: 'Community names are proper nouns.' },
  {
    pattern: /^mic\.(downloadSvg|downloadPng|variants\.beige|colorsTable\.color)$/,
    reason: 'Technical or color labels.',
  },
  { pattern: /^contactPage\.form\.phonePlaceholder$/, reason: 'Phone format stays the same.' },
  { pattern: /^newsletterPage\.form\.consentSuffix$/, reason: 'Punctuation only.' },
  { pattern: /^mic\.colorsTable\.(hex|rgb|cmyk|pantone)$/, reason: 'Color-space acronyms.' },
  // Admin panel: terms that are intentionally identical in es/en.
  {
    pattern: /^admin\.newsletter\.monthPicker\.[a-z]{3}$/,
    reason: 'Month abbreviations that coincide in es/en.',
  },
  {
    pattern:
      /^admin\.stats\.(autoLabel|newsletterBacklog|statusOk|statusError|idle|redis|uptime|waiting|active|delayed|failed|completed)$/,
    reason: 'Technical / BullMQ / proper-noun status labels shown verbatim in both locales.',
  },
  {
    pattern:
      /^admin\.(nav\.newsletter\.name|newsletter\.list\.title|siteDefaultImages\.newsletterHeading|dashboard\.newsletter)$/,
    reason: 'Newsletter is a brand term kept in English.',
  },
  { pattern: /^admin\.(equality|newsletter\.list)\.pdfLabel$/, reason: 'PDF acronym.' },
  {
    pattern:
      /^admin\.(media\.logoLabel|equality\.metaLabel|tags\.slugPrefix|about\.visible|media\.websitePlaceholder|financialReports\.titlePlaceholderOther)$/,
    reason: 'Proper/technical labels or example placeholders identical in both locales.',
  },
  {
    pattern:
      /^admin\.(siteDefaultImages\.seoIntroAfter|newsletter\.subscribers\.deleteConfirmSuffix)$/,
    reason: 'Punctuation only.',
  },
]

function loadLocale(file: string): JSONValue {
  const raw = readFileSync(resolve(LOCALES_DIR, file), 'utf-8')
  return JSON.parse(raw) as JSONValue
}

function collectIdenticalStrings(
  base: JSONValue,
  target: JSONValue,
  prefix = ''
): IdenticalMatch[] {
  if (typeof base === 'string' && typeof target === 'string') {
    return base === target ? [{ key: prefix, value: base }] : []
  }

  if (
    !base ||
    !target ||
    typeof base !== 'object' ||
    typeof target !== 'object' ||
    Array.isArray(base) ||
    Array.isArray(target)
  ) {
    return []
  }

  return Object.entries(base).flatMap(([key, value]) => {
    const targetValue = (target as Record<string, JSONValue>)[key]
    const nextPrefix = prefix ? `${prefix}.${key}` : key
    return collectIdenticalStrings(value, targetValue, nextPrefix)
  })
}

function isAllowed(key: string): AllowlistEntry | undefined {
  return ALLOWLIST.find((entry) => entry.pattern.test(key))
}

const base = loadLocale(BASE_LOCALE)
const target = loadLocale(TARGET_LOCALE)
const matches = collectIdenticalStrings(base, target)
const allowedMatches = matches.filter((match) => isAllowed(match.key))
const reviewCandidates = matches.filter((match) => !isAllowed(match.key))

console.log(`Locale identical-value audit: ${TARGET_LOCALE} vs ${BASE_LOCALE}`)
console.log('')

if (allowedMatches.length > 0) {
  console.log(`Allowed identical strings (${allowedMatches.length}):`)
  for (const match of allowedMatches) {
    const entry = isAllowed(match.key)
    console.log(`  - ${match.key}: ${match.value}`)
    if (entry) {
      console.log(`    reason: ${entry.reason}`)
    }
  }
  console.log('')
}

if (reviewCandidates.length > 0) {
  console.log(`Review candidates (${reviewCandidates.length}):`)
  for (const match of reviewCandidates) {
    console.log(`  - ${match.key}: ${match.value}`)
  }
  console.log('')
  console.log('One or more identical strings need translation review.')
  process.exit(1)
}

console.log('No review candidates found.')
