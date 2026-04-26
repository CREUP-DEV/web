import { defineEventHandler } from 'h3'
import { getAssociatedMembersResponse } from '../utils/public/publicMembers'
import { setPublicApiCacheHeaders } from '../utils/cache/publicRouteCache'

export default defineEventHandler(async (event) => {
  setPublicApiCacheHeaders(event)

  const payload = await getAssociatedMembersResponse(event)
  return {
    data: payload.members,
    meta: {
      generatedAt: payload.generatedAt,
    },
  }
})
