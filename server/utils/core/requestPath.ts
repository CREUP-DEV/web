import type { H3Event } from 'h3'

/**
 * The request path as h3 routes it, for middleware that gates a prefix.
 *
 * `getRequestURL(event).pathname` keeps percent-escapes (WHATWG URL does not decode them), while
 * h3 decodes the path before it matches routes. A guard that compared the raw pathname therefore
 * let `/api/%61dmin/summary` through, and the router still ran the `/api/admin/summary` handler.
 * This decodes the path the way h3 does (`%25` and encoded slashes stay encoded), drops the query,
 * collapses repeated slashes and backslashes, and lower-cases it, so a prefix check on the result
 * can only ever cover more than the router serves, never less.
 */
export function getRoutedRequestPath(event: H3Event): string {
  const raw = event.node.req.originalUrl || event.path || '/'
  const queryAt = raw.search(/[?#]/)
  const path = queryAt === -1 ? raw : raw.slice(0, queryAt)
  return (decodeRequestPath(path).replace(/[/\\]+/g, '/') || '/').toLowerCase()
}

/** True when `path` (from getRoutedRequestPath) is `prefix` itself or under it. */
export function isUnderPathPrefix(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`)
}

function decodeRequestPath(path: string): string {
  try {
    return decodeURIComponent(path.replace(/%25/g, '%2525').replace(/%2F/gi, '%252F'))
  } catch {
    return path
  }
}
