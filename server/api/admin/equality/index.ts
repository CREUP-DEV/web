import { createError, defineEventHandler } from 'h3'
export default defineEventHandler(() => {
  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
