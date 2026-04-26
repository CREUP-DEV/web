import { defineEventHandler, setHeader } from 'h3'
import { getAdminDashboardSummary } from '../../utils/admin/adminSummary'

export default defineEventHandler(async (event) => {
  setHeader(event, 'cache-control', 'no-store')
  return getAdminDashboardSummary()
})
