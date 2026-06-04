import { createError, defineEventHandler, readBody } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import {
  assertAdminAccessCanBeRevoked,
  getAdminAccessForUpdate,
} from '../../../utils/admin/adminAccess'
import { idRouteParamSchema, validateBody, validateRouteParams } from '../../../utils/validation'
import { updateAdminAccessSchema } from '~~/shared/utils/adminSchemas'

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

    return { data: item }
  } catch (error) {
    throwAdminMutationError('admin.access.update', error, event)
  }
})
