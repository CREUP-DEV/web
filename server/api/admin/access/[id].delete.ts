import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { assertAdminAccessCanBeRevoked, getAdminAccessForUpdate } from '../../../utils/adminAccess'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  await db.transaction(async (tx) => {
    const entry = await getAdminAccessForUpdate(tx, id)

    if (!entry) {
      throw createError({ statusCode: 404, message: 'Acceso no encontrado' })
    }

    await assertAdminAccessCanBeRevoked(tx, entry)
    await tx.delete(adminAccess).where(eq(adminAccess.id, id))
  })

  return { success: true }
})
