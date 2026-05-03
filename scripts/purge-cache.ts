#!/usr/bin/env tsx
/**
 * Purges Redis-backed public caches.
 *
 * Usage:
 *   pnpm cache:purge
 *   pnpm cache:purge -- --dry-run
 *   pnpm cache:purge -- --external-only
 *   pnpm cache:purge -- --nitro-only
 */
import 'dotenv/config'
import Redis from 'ioredis'

const REDIS_SCAN_COUNT = 500

const CACHE_PATTERNS = {
  external: ['creup:web:external-api-cache:*', 'creup:web:external-api-cache-lock:*'],
  nitro: ['creup:web:cache:*'],
} as const

type CacheScope = keyof typeof CACHE_PATTERNS

interface PurgeOptions {
  dryRun: boolean
  scopes: CacheScope[]
}

function printUsageAndExit(): never {
  console.log(`Usage: pnpm cache:purge -- [--dry-run] [--external-only|--nitro-only]

Options:
  --dry-run        Count matching keys without deleting them.
  --external-only Purge only external API/cache keys.
  --nitro-only    Purge only Nitro public handler/page cache keys.
  --help          Show this help.`)
  process.exit(0)
}

function parseOptions(argv: string[]): PurgeOptions {
  const normalizedArgv = argv.filter((arg) => arg !== '--')
  const flags = new Set(normalizedArgv)

  if (flags.has('--help') || flags.has('-h')) {
    printUsageAndExit()
  }

  const unknownFlags = normalizedArgv.filter(
    (arg) => !['--dry-run', '--external-only', '--nitro-only'].includes(arg)
  )
  if (unknownFlags.length > 0) {
    console.error(`Unknown option: ${unknownFlags.join(', ')}`)
    process.exit(1)
  }

  if (flags.has('--external-only') && flags.has('--nitro-only')) {
    console.error('Use only one of --external-only or --nitro-only.')
    process.exit(1)
  }

  const scopes: CacheScope[] = flags.has('--external-only')
    ? ['external']
    : flags.has('--nitro-only')
      ? ['nitro']
      : ['external', 'nitro']

  return {
    dryRun: flags.has('--dry-run'),
    scopes,
  }
}

function getRedisUrl() {
  const redisUrl = process.env.NUXT_REDIS_URL?.trim() || process.env.REDIS_URL?.trim()

  if (!redisUrl) {
    console.error('NUXT_REDIS_URL or REDIS_URL must be set.')
    process.exit(1)
  }

  return redisUrl
}

async function scanMatchingKeys(client: Redis, pattern: string) {
  const keys: string[] = []
  let cursor = '0'

  do {
    const [nextCursor, batch] = await client.scan(
      cursor,
      'MATCH',
      pattern,
      'COUNT',
      REDIS_SCAN_COUNT
    )
    cursor = nextCursor
    keys.push(...batch)
  } while (cursor !== '0')

  return keys
}

async function purgePattern(client: Redis, pattern: string, dryRun: boolean) {
  const keys = await scanMatchingKeys(client, pattern)

  if (!dryRun && keys.length > 0) {
    await client.unlink(...keys)
  }

  return keys.length
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const client = new Redis(getRedisUrl(), {
    enableAutoPipelining: true,
    lazyConnect: true,
    maxRetriesPerRequest: 1,
  })

  let total = 0

  try {
    await client.connect()

    for (const scope of options.scopes) {
      for (const pattern of CACHE_PATTERNS[scope]) {
        const count = await purgePattern(client, pattern, options.dryRun)
        total += count
        console.log(`${options.dryRun ? 'Would purge' : 'Purged'} ${count} keys: ${pattern}`)
      }
    }
  } finally {
    try {
      await client.quit()
    } catch {
      client.disconnect()
    }
  }

  console.log(`${options.dryRun ? 'Matched' : 'Purged'} ${total} cache keys total.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
