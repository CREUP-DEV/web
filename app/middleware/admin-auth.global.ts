import { DEFAULT_LOCALE_CODE, SUPPORTED_LOCALE_CODES } from '~~/shared/constants/locales'

const ADMIN_LOGIN_PATH = '/admin/login'
const SESSION_RECHECK_INTERVAL_MS = 2 * 60 * 1000

const localePrefixes = new Set<string>(
  SUPPORTED_LOCALE_CODES.filter((code) => code !== DEFAULT_LOCALE_CODE)
)

/**
 * Strip a leading non-default locale segment so the guard matches both `/admin/...` and
 * `/en/admin/...`. Under `prefix_except_default` the localized admin routes exist, and without this
 * normalization `startsWith('/admin')` would skip auth on them entirely.
 */
function toCanonicalAdminPath(path: string) {
  const [, firstSegment, ...rest] = path.split('/')
  if (firstSegment && localePrefixes.has(firstSegment.toLowerCase())) {
    const stripped = `/${rest.join('/')}`
    return stripped === '/' ? '/' : stripped
  }
  return path
}

export default defineNuxtRouteMiddleware(async (to) => {
  const localePath = useLocalePath()
  const canonicalPath = toCanonicalAdminPath(to.path)

  if (!canonicalPath.startsWith('/admin') || canonicalPath === ADMIN_LOGIN_PATH) {
    return
  }

  const sessionVerified = useState('admin-session-verified', () => false)
  const adminIsEnvAdmin = useState('admin-is-env-admin', () => false)
  const lastCheckedAt = useState<number>('admin-session-last-checked', () => 0)

  if (import.meta.client && sessionVerified.value) {
    const timeSinceCheck = Date.now() - lastCheckedAt.value
    if (timeSinceCheck < SESSION_RECHECK_INTERVAL_MS) {
      return
    }
  }

  try {
    const session = await $fetch<{
      authenticated: boolean
      envAdmin: boolean
    }>('/api/admin/session', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    })
    sessionVerified.value = true
    adminIsEnvAdmin.value = session.envAdmin
    lastCheckedAt.value = Date.now()
  } catch {
    sessionVerified.value = false
    adminIsEnvAdmin.value = false
    lastCheckedAt.value = 0
    return navigateTo(localePath(ADMIN_LOGIN_PATH))
  }
})
