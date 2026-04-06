import { defineEventHandler } from 'h3'
import { getAdminSession } from '../../utils/requireAuth'

export default defineEventHandler(async (event) => {
  const session = getAdminSession(event)

  return {
    user: session.user,
    session: session.session,
  }
})
