import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import {
  assertAdminAccessCanBeRevoked,
  getAdminAccessForUpdate,
} from '../../../utils/admin/adminAccess'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    await db.transaction(async (tx) => {
      const entry = await getAdminAccessForUpdate(tx, id)

      if (!entry) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'accessNotFound'),
        })
      }

      await assertAdminAccessCanBeRevoked(tx, entry, event)
      await tx.delete(adminAccess).where(eq(adminAccess.id, id))
    })

    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.access.delete', error, event)
  }
})
