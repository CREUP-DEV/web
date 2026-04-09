import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { assertAdminAccessCanBeRevoked, getAdminAccessForUpdate } from '../../../utils/adminAccess'
import {
  idRouteParamSchema,
  updateAdminAccessSchema,
  validateBody,
  validateRouteParams,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)
  const body = await readBody(event)

  try {
    const validated = validateBody(updateAdminAccessSchema, body)
    const item = await db.transaction(async (tx) => {
      const entry = await getAdminAccessForUpdate(tx, id)

      if (!entry) {
        throw createError({ statusCode: 404, message: 'Acceso no encontrado' })
      }

      if (!validated.active) {
        await assertAdminAccessCanBeRevoked(tx, entry)
      }

      const [updated] = await tx
        .update(adminAccess)
        .set({ active: validated.active })
        .where(eq(adminAccess.id, id))
        .returning()

      if (!updated) {
        throw createError({
          statusCode: 500,
          message: 'No se pudo actualizar el acceso',
        })
      }

      return updated
    })

    return { item }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }

    throw createError({
      statusCode: 400,
      message: error instanceof Error ? error.message : 'Error de validación',
    })
  }
})
