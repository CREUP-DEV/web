const ADMIN_LOGIN_PATH = '/admin/login'

export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin') || to.path === ADMIN_LOGIN_PATH) {
    return
  }

  try {
    await $fetch('/api/admin/session', {
      headers: import.meta.server ? useRequestHeaders(['cookie']) : undefined,
    })
  } catch {
    return navigateTo(ADMIN_LOGIN_PATH)
  }
})
