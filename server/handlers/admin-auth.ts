import { defineEventHandler } from 'h3'
import { requireAuth, type AdminAuthEventContext } from '../utils/auth/requireAuth'
import {
  assertAdminCsrfMutationRequest,
  assertSameOriginAdminMutationRequest,
  ensureAdminCsrfCookie,
} from '../utils/admin/adminRequestProtection'

export default defineEventHandler(async (event) => {
  if (event.method === 'OPTIONS') {
    return
  }

  assertSameOriginAdminMutationRequest(event)
  const session = await requireAuth(event)
  ensureAdminCsrfCookie(event)
  assertAdminCsrfMutationRequest(event)
  const context = event.context as AdminAuthEventContext
  context.adminSession = session
})
