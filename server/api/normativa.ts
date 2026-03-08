/**
 * Normativa API endpoint
 * Proxies regulation documents from the external CREUP intranet API.
 */

import { defineEventHandler } from 'h3'
import { fetchNormativa } from '../utils/normativa'

export default defineEventHandler(async (event) => {
  return fetchNormativa(event)
})
