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
import { existsSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

/**
 * Every value the built server needs in order to boot, and nothing more.
 *
 * Deliberately hermetic: the real environment is NOT forwarded and `.env` is NOT read. An earlier
 * version loaded `.env`, which made the check pass locally while the same command was still unable
 * to start the server in CI — the divergence hid a broken pipeline step behind a green local run.
 * Everything here is a placeholder, so the check can only ever exercise the guard: nothing it sends
 * reaches a database, Redis, OAuth or SMTP, because the request is refused before any of them.
 *
 * The `NUXT_*` entries override the values baked into the artefact at build time, which is what
 * makes a build produced with a populated `.env` behave the same as CI's build produced without one.
 */
const SERVER_ENV = {
  DATABASE_URL: 'postgresql://check:check@127.0.0.1:1/check',
  APP_SECRET: 'admin-auth-check-placeholder-secret',
  GOOGLE_CLIENT_ID: 'admin-auth-check-client-id',
  GOOGLE_CLIENT_SECRET: 'admin-auth-check-client-secret',
  NUXT_ADMIN_EMAILS: 'admin-auth-check@example.invalid',
  NUXT_SITE_URL: 'http://127.0.0.1',
  NUXT_REDIS_URL: 'redis://127.0.0.1:1',
  NUXT_EXTERNAL_API_BASE_URL: 'http://127.0.0.1:1',
  NUXT_GOOGLE_CALENDAR_API_KEY: 'admin-auth-check-calendar-key',
  NUXT_GOOGLE_CALENDAR_ID: 'admin-auth-check@group.calendar.google.com',
  NUXT_SMTP_HOST: '127.0.0.1',
  NUXT_SMTP_PORT: '1025',
  NUXT_SMTP_SECURE: 'false',
  NUXT_SMTP_USER: 'admin-auth-check',
  NUXT_SMTP_PASS: 'admin-auth-check',
}

const SERVER_ENTRY = '.output/server/index.mjs'
const PORT = Number(process.env.ADMIN_AUTH_CHECK_PORT ?? 3123)
const ORIGIN = `http://127.0.0.1:${PORT}`
const BOOT_TIMEOUT_MS = 60_000

/**
 * Readiness probe. Deliberately one of the guarded routes rather than `/health`, which probes
 * PostgreSQL, Redis, the external API and SMTP — all of them placeholders here, so it only answered
 * once every probe had timed out, and it made the check's own runtime depend on those clients.
 * A guarded route answers as soon as the server listens, and its 401 is the signal itself.
 */
const READINESS_PATH = '/api/admin/summary'

/** A read, a write and a nested route: the guard has to cover the whole prefix, not just the root. */
const CASES = [
  { method: 'GET', path: READINESS_PATH },
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
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    ...SERVER_ENV,
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
      // Any answer means it is listening; whether that answer is the expected 401 is the loop
      // below's job, so a missing guard shows up as a failure rather than as a boot timeout.
      await fetch(`${ORIGIN}${READINESS_PATH}`, { redirect: 'manual' })
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
