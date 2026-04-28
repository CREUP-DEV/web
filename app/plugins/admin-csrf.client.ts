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

function resolveRequestMethod(request: RequestInfo | URL, options: { method?: string }) {
  return (
    options.method ||
    (request instanceof Request ? request.method : undefined) ||
    'GET'
  ).toUpperCase()
}

export default defineNuxtPlugin(() => {
  const csrfToken = useCookie<string | null>(ADMIN_CSRF_COOKIE_NAME)
  const enhancedFetch = $fetch.create({
    onRequest({ request, options }) {
      if (!isAdminApiRequest(request)) {
        return
      }

      if (!UNSAFE_ADMIN_METHODS.has(resolveRequestMethod(request, options))) {
        return
      }

      const token = csrfToken.value?.trim()
      if (!token) {
        return
      }

      const headers = new Headers(options.headers || undefined)

      if (!headers.has(ADMIN_CSRF_HEADER_NAME)) {
        headers.set(ADMIN_CSRF_HEADER_NAME, token)
      }

      options.headers = headers
    },
  })

  globalThis.$fetch = enhancedFetch
})
