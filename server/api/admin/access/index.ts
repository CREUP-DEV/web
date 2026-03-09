import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import {
  getAllowedAdminEmailDomain,
  isAdminEmailAuthorized,
  isAdminEmailFromAllowedDomain,
  listAdminAccess,
} from '../../../utils/adminAccess'
import { requireAuth } from '../../../utils/requireAuth'
import { createAdminAccessSchema, validateBody } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  if (event.method === 'GET') {
    await requireAuth(event)
    return listAdminAccess()
  }

  if (event.method === 'POST') {
    await requireAuth(event)
    const body = await readBody(event)

    try {
      const validated = validateBody(createAdminAccessSchema, body)
      const allowedDomain = getAllowedAdminEmailDomain()

      if (!isAdminEmailFromAllowedDomain(validated.email)) {
        throw createError({
          statusCode: 400,
          message: allowedDomain
            ? `Solo se permiten correos del dominio @${allowedDomain}.`
            : 'El correo no pertenece al dominio permitido.',
        })
      }

      if (await isAdminEmailAuthorized(validated.email)) {
        throw createError({
          statusCode: 409,
          message: 'Ese correo ya tiene acceso al panel.',
        })
      }

      const [existingEntry] = await db
        .select({ id: adminAccess.id })
        .from(adminAccess)
        .where(eq(adminAccess.email, validated.email))
        .limit(1)

      if (existingEntry) {
        throw createError({
          statusCode: 409,
          message: 'Ese correo ya está registrado en la lista de accesos.',
        })
      }

      const [item] = await db.insert(adminAccess).values(validated).returning()

      return { item }
    } catch (error) {
      if (error instanceof Error && 'statusCode' in error) {
        throw error
      }

      throw createError({
        statusCode: 400,
        message: error instanceof Error ? error.message : 'Error de validación',
      })
    }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
