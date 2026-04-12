import { defineEventHandler } from 'h3'
import { listAdminAccess } from '../../../utils/adminAccess'

export default defineEventHandler(async () => {
  const { items, summary } = await listAdminAccess()

  return {
    data: items,
    meta: summary,
  }
})
