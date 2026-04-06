import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { assertAdminAccessCanBeRevoked, getAdminAccessById } from '../../../utils/adminAccess'
import {
  idRouteParamSchema,
  updateAdminAccessSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  if (event.method === 'PATCH') {
    const body = await readBody(event)

    try {
      const validated = validateBody(updateAdminAccessSchema, body)
      const entry = await getAdminAccessById(id)

      if (!entry) {
        throw createError({ statusCode: 404, message: 'Acceso no encontrado' })
      }

      if (!validated.active) {
        await assertAdminAccessCanBeRevoked(entry)
      }

      const [item] = await db
        .update(adminAccess)
        .set({ active: validated.active })
        .where(eq(adminAccess.id, id))
        .returning()

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

  if (event.method === 'DELETE') {
    const entry = await getAdminAccessById(id)

    if (!entry) {
      throw createError({ statusCode: 404, message: 'Acceso no encontrado' })
    }

    await assertAdminAccessCanBeRevoked(entry)
    await db.delete(adminAccess).where(eq(adminAccess.id, id))

    return { success: true }
  }

  throw createError({ statusCode: 405, message: 'Método no permitido' })
})
