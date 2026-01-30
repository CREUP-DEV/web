import { defineEventHandler, createError } from 'h3'
import { auth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers,
  })

  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'No autorizado',
    })
  }

  return {
    user: session.user,
    session: session.session,
  }
})
