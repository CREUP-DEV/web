import { defineEventHandler } from 'h3'
import { fetchPolicyDocuments } from '../utils/policyDocuments'

export default defineEventHandler(async (event) => {
  return fetchPolicyDocuments(event, '/api/posicionamientos', 'Posicionamientos')
})
