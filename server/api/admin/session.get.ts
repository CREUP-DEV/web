import { defineEventHandler, setHeader } from 'h3'
import { getAdminSession } from '../../utils/requireAuth'

export default defineEventHandler(async (event) => {
  getAdminSession(event)
  setHeader(event, 'cache-control', 'no-store')

  return {
    authenticated: true,
  }
})
