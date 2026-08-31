import { defineEventHandler, getRequestURL, setHeader } from 'h3'
import { requireAuth, type AdminAuthEventContext } from '../utils/auth/requireAuth'
import {
  assertAdminCsrfMutationRequest,
  assertSameOriginAdminMutationRequest,
  ensureAdminCsrfCookie,
} from '../utils/admin/adminRequestProtection'

const ADMIN_API_PREFIX = '/api/admin'

/**
 * Session, same-origin and CSRF guard for the whole admin API.
 *
 * This lives in `server/middleware` and matches the prefix itself rather than being registered as a
 * `serverHandlers` entry with `route: '/api/admin/**'`: Nitro does not apply that route filter to
 * middleware, so the guard never ran and every admin endpoint answered anonymously. Middleware here
 * runs for every request, hence the explicit prefix check before anything else.
 *
 * `scripts/check-admin-auth.mjs` asserts the 401 against a production build.
 */
export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)
  if (pathname !== ADMIN_API_PREFIX && !pathname.startsWith(`${ADMIN_API_PREFIX}/`)) {
    return
  }

  if (event.method === 'OPTIONS') {
    return
  }

  assertSameOriginAdminMutationRequest(event)
  setHeader(event, 'cache-control', 'no-store')
  const session = await requireAuth(event)
  ensureAdminCsrfCookie(event)
  assertAdminCsrfMutationRequest(event)
  const context = event.context as AdminAuthEventContext
  context.adminSession = session
})
