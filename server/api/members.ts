import { defineEventHandler } from 'h3'
import { getAssociatedMembersResponse } from '../utils/publicMembers'
import { setPublicApiCacheHeaders } from '../utils/publicRouteCache'

export default defineEventHandler(async (event) => {
  setPublicApiCacheHeaders(event)

  return getAssociatedMembersResponse(event)
})
