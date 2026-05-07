import { createError } from 'h3'

export function throwMethodNotAllowed(): never {
  throw createError({ statusCode: 405, message: 'Método no permitido' })
}
