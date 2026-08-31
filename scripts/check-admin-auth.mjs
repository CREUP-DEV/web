/**
 * Boots the production build and asserts that the admin API refuses anonymous callers.
 *
 * This exists because the guard was once registered as a `serverHandlers` entry with
 * `route: '/api/admin/**'`, which Nitro does not apply to middleware: every admin endpoint answered
 * 200 without a session, and nothing caught it because `/admin` still redirected to the login page
 * in the browser. Only a request against the built server proves the guard is wired.
 *
 * Usage: pnpm build && pnpm check:admin-auth
 */
import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

/**
 * The built server reads its configuration from the real environment, unlike the dev server which
 * loads `.env` for you. Parsed here rather than pulled in as a dependency so the check stays a
 * plain script; values are only forwarded to the child process, never logged.
 */
const loadDotEnv = () => {
  if (!existsSync('.env')) return {}

  const parsed = {}
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue
    parsed[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return parsed
}

const SERVER_ENTRY = '.output/server/index.mjs'
const PORT = Number(process.env.ADMIN_AUTH_CHECK_PORT ?? 3123)
const ORIGIN = `http://127.0.0.1:${PORT}`
const BOOT_TIMEOUT_MS = 60_000

/** A read, a write and a nested route: the guard has to cover the whole prefix, not just the root. */
const CASES = [
  { method: 'GET', path: '/api/admin/summary' },
  { method: 'GET', path: '/api/admin/member-org-catalog' },
  { method: 'GET', path: '/api/admin/areas' },
  { method: 'GET', path: '/api/admin/area-catalog' },
  { method: 'DELETE', path: '/api/admin/member-org-catalog/does-not-exist' },
  { method: 'POST', path: '/api/admin/member-org-catalog' },
]

if (!existsSync(SERVER_ENTRY)) {
  console.error(`✖ ${SERVER_ENTRY} not found. Run \`pnpm build\` first.`)
  process.exit(1)
}

const server = spawn(process.execPath, [SERVER_ENTRY], {
  env: {
    ...loadDotEnv(),
    ...process.env,
    PORT: String(PORT),
    NITRO_PORT: String(PORT),
    HOST: '127.0.0.1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let serverLog = ''
server.stdout.on('data', (chunk) => (serverLog += chunk))
server.stderr.on('data', (chunk) => (serverLog += chunk))

const stopServer = () => {
  if (!server.killed) server.kill('SIGTERM')
}
process.on('exit', stopServer)

const waitForServer = async () => {
  const deadline = Date.now() + BOOT_TIMEOUT_MS
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`server exited early (code ${server.exitCode})\n${serverLog}`)
    }
    try {
      await fetch(`${ORIGIN}/health`, { redirect: 'manual' })
      return
    } catch {
      await sleep(500)
    }
  }
  throw new Error(`server did not start within ${BOOT_TIMEOUT_MS}ms\n${serverLog}`)
}

try {
  await waitForServer()

  const failures = []
  for (const { method, path } of CASES) {
    const response = await fetch(`${ORIGIN}${path}`, { method, redirect: 'manual' })

    // 401 is the guard talking. 403 (an authenticated but unauthorised email) and 405 are equally
    // fine — what must never happen is a 2xx, or a 4xx raised by the handler itself after the
    // request already reached it.
    const refused = response.status === 401 || response.status === 403
    if (!refused) {
      const body = (await response.text()).slice(0, 200)
      failures.push(`${method} ${path} → ${response.status} (expected 401/403)\n    ${body}`)
    }
  }

  if (failures.length > 0) {
    console.error('✖ admin API reachable without a session:')
    for (const failure of failures) console.error(`  - ${failure}`)
    process.exit(1)
  }

  console.log(`✓ admin API refuses anonymous callers (${CASES.length} route(s) checked)`)
} catch (error) {
  console.error('✖ admin auth check could not run:', error instanceof Error ? error.message : error)
  process.exit(1)
} finally {
  stopServer()
}
