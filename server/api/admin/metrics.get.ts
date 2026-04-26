import { defineEventHandler, setHeader } from 'h3'
import { getAdminOperationalStats } from '../../utils/admin/adminOperationalStats'
import { requireEnvAdmin } from '../../utils/auth/requireAuth'

export default defineEventHandler(async (event) => {
  await requireEnvAdmin(event)
  setHeader(event, 'cache-control', 'no-store')

  return {
    data: await getAdminOperationalStats(),
  }
})
