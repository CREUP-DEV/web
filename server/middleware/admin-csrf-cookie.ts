import { defineEventHandler } from 'h3'
import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/constants/locales'
import { ensureAdminCsrfCookie } from '../utils/admin/adminRequestProtection'
import { getRoutedRequestPath, isUnderPathPrefix } from '../utils/core/requestPath'

const ADMIN_PAGE_PREFIXES = [
  '/admin',
  ...SUPPORTED_LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE_CODE).map(
    (code) => `/${code.toLowerCase()}/admin`
  ),
]

/**
 * Issues the admin CSRF cookie on the admin pages' own responses.
 *
 * The admin-auth middleware sets it on `/api/admin` responses, but while a page renders on the
 * server its data is fetched through Nitro's internal `$fetch`, whose `Set-Cookie` never reaches
 * the browser. A freshly loaded editor then held no token and its first save was refused with a
 * 403. Setting it on the page response puts it in the browser before any client code can mutate.
 * It only sets a cookie; the checks stay in the admin-auth middleware.
 */
export default defineEventHandler((event) => {
  const path = getRoutedRequestPath(event)
  if (ADMIN_PAGE_PREFIXES.some((prefix) => isUnderPathPrefix(path, prefix))) {
    ensureAdminCsrfCookie(event)
  }
})
