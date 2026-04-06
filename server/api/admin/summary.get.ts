import { getAdminDashboardSummary } from '../../utils/adminSummary'

export default defineCachedEventHandler(() => getAdminDashboardSummary(), {
  maxAge: 30,
  swr: true,
})
