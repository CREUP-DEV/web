import { defineEventHandler } from 'h3'
import { getExternalApiCacheOptions, setExternalApiCacheHeaders } from '../utils/externalApiCache'
import { getEventsPayload } from '../utils/events'

export default defineEventHandler(async (event) => {
  setExternalApiCacheHeaders(event, getExternalApiCacheOptions(event))
  return getEventsPayload(event)
})
