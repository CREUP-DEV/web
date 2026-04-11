#!/usr/bin/env tsx
/**
 * Verifies that i18n locale files have matching leaf keys.
 * Fails with a non-zero exit code if the key sets diverge.
 *
 * Usage: tsx scripts/check-i18n-parity.ts
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOCALES_DIR = resolve(__dirname, '../i18n/locales')

type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

function flattenKeys(obj: JSONValue, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return [prefix]
  }

  return Object.entries(obj).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  )
}

function loadLocale(file: string): Set<string> {
  const raw = readFileSync(resolve(LOCALES_DIR, file), 'utf-8')
  const parsed = JSON.parse(raw) as JSONValue
  return new Set(flattenKeys(parsed))
}

const BASE = 'es.json'
const localeFiles = ['en.json']

const baseKeys = loadLocale(BASE)
let hasErrors = false

for (const file of localeFiles) {
  const keys = loadLocale(file)

  const missingInTarget = [...baseKeys].filter((k) => !keys.has(k))
  const extraInTarget = [...keys].filter((k) => !baseKeys.has(k))

  if (missingInTarget.length === 0 && extraInTarget.length === 0) {
    console.log(`✓ ${file} — keys match ${BASE}`)
    continue
  }

  hasErrors = true
  console.error(`\n✗ ${file} — key mismatch with ${BASE}`)

  if (missingInTarget.length > 0) {
    console.error(`  Missing keys (in ${BASE} but not in ${file}):`)
    for (const key of missingInTarget) {
      console.error(`    - ${key}`)
    }
  }

  if (extraInTarget.length > 0) {
    console.error(`  Extra keys (in ${file} but not in ${BASE}):`)
    for (const key of extraInTarget) {
      console.error(`    + ${key}`)
    }
  }
}

if (hasErrors) {
  process.exit(1)
}
