import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { validateBody } from '../../../utils/validation'
import { createAdminAccessSchema } from '~~/shared/utils/adminSchemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(createAdminAccessSchema, body)

  try {
    const [item] = await db
      .insert(adminAccess)
      .values(validated)
      .onConflictDoNothing({ target: adminAccess.email })
      .returning()

    // onConflictDoNothing returns nothing when the row already existed
    if (!item) {
      throw createError({
        statusCode: 409,
        message: 'Ese correo ya está registrado en la lista de accesos.',
      })
    }

    return { data: item }
  } catch (error) {
    throwAdminMutationError('admin.access.create', error, event)
  }
})
