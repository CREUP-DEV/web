import { ADMIN_CSRF_COOKIE_NAME, ADMIN_CSRF_HEADER_NAME } from '~~/shared/constants/adminSecurity'

const UNSAFE_ADMIN_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

function isAdminApiRequest(request: RequestInfo | URL) {
  const rawUrl =
    typeof request === 'string'
      ? request
      : request instanceof URL
        ? request.toString()
        : request instanceof Request
          ? request.url
          : String(request)

  return rawUrl.startsWith('/api/admin/') || rawUrl.includes('/api/admin/')
}

/**
 * The CSRF token as the browser holds it right now. Read per request rather than captured once at
 * setup: the cookie can arrive after the app booted (an `/api/admin` response issues it when the
 * page response did not), and a stale capture would send no token.
 */
function readCsrfCookie() {
  const prefix = `${ADMIN_CSRF_COOKIE_NAME}=`
  for (const part of document.cookie.split(';')) {
    const entry = part.trim()
    if (entry.startsWith(prefix)) return decodeURIComponent(entry.slice(prefix.length)).trim()
  }
  return null
}

function resolveRequestMethod(request: RequestInfo | URL, options: { method?: string }) {
  return (
    options.method ||
    (request instanceof Request ? request.method : undefined) ||
    'GET'
  ).toUpperCase()
}

/**
 * Single interceptor for admin `$fetch` / `useFetch` requests. Attaches:
 * - `x-request-locale` (every admin request) so the server returns locale-aware error messages.
 * - the CSRF token (unsafe methods only).
 *
 * Both live in one `onRequest` on purpose: chaining a second `$fetch.create()` would not inherit
 * this interceptor (ofetch `.create` starts from fresh defaults), silently dropping CSRF.
 *
 * `nuxtApp.$i18n` is a lazy getter installed by `i18n:plugin`, so the locale is read inside
 * `onRequest` (not captured at setup, where the getter may not exist yet). `dependsOn` also forces
 * this plugin to run after i18n initializes.
 */
export default defineNuxtPlugin({
  name: 'admin-fetch',
  dependsOn: ['i18n:plugin'],
  setup(nuxtApp) {
    const enhancedFetch = $fetch.create({
      onRequest({ request, options }) {
        if (!isAdminApiRequest(request)) {
          return
        }

        const headers = new Headers(options.headers || undefined)

        const locale = (nuxtApp.$i18n as { locale?: { value?: string } } | undefined)?.locale?.value
        if (locale && !headers.has('x-request-locale')) {
          headers.set('x-request-locale', locale)
        }

        if (UNSAFE_ADMIN_METHODS.has(resolveRequestMethod(request, options))) {
          const token = readCsrfCookie()
          if (token && !headers.has(ADMIN_CSRF_HEADER_NAME)) {
            headers.set(ADMIN_CSRF_HEADER_NAME, token)
          }
        }

        options.headers = headers
      },
    })

    globalThis.$fetch = enhancedFetch
  },
})
