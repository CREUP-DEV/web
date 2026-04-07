import { defineEventHandler } from 'h3'
import { listAdminAccess } from '../../../utils/adminAccess'

export default defineEventHandler(async () => {
  return listAdminAccess()
})
