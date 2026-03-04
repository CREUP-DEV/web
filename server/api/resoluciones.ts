/**
 * Resoluciones API endpoint
 * Proxies resolution documents from the external CREUP intranet API.
 */

import { defineEventHandler } from 'h3'
import { fetchPolicyDocuments } from '../utils/policyDocuments'

export default defineEventHandler(async (event) => {
  return fetchPolicyDocuments(event, '/api/resoluciones', 'Resoluciones')
})
