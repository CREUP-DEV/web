import { defineEventHandler, getRequestURL } from 'h3'
import { requireAuth, type AdminAuthEventContext } from '../utils/requireAuth'

const ADMIN_API_PREFIX = '/api/admin'

export default defineEventHandler(async (event) => {
  const { pathname } = getRequestURL(event)

  if (!pathname.startsWith(ADMIN_API_PREFIX) || event.method === 'OPTIONS') {
    return
  }

  const session = await requireAuth(event)
  const context = event.context as AdminAuthEventContext
  context.adminSession = session
})
