import { defineEventHandler } from 'h3'
import { fetchNormativa } from '../utils/normativa'

export default defineEventHandler(async (event) => {
  return fetchNormativa(event)
})
