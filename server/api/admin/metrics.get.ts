import { defineEventHandler, setHeader } from 'h3'
import { requireAuth } from '../../utils/requireAuth'
import { getDatabasePoolStats } from '../../db'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  setHeader(event, 'cache-control', 'no-store')

  return {
    database: getDatabasePoolStats(),
  }
})
