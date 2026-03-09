import { defineEventHandler } from 'h3'
import { requireAuth } from '../../utils/requireAuth'

export default defineEventHandler(async (event) => {
  const session = await requireAuth(event)

  return {
    user: session.user,
    session: session.session,
  }
})
