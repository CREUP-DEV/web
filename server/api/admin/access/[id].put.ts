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
})
