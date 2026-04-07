import { createError, defineEventHandler } from 'h3'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { assertAdminAccessCanBeRevoked, getAdminAccessById } from '../../../utils/adminAccess'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'
import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  const entry = await getAdminAccessById(id)

  if (!entry) {
    throw createError({ statusCode: 404, message: 'Acceso no encontrado' })
  }

  await assertAdminAccessCanBeRevoked(entry)
  await db.delete(adminAccess).where(eq(adminAccess.id, id))

  return { success: true }
})
