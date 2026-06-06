import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../db'
import { adminAccess } from '../../../db/schema'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import { validateBody } from '../../../utils/validation'
import { createAdminAccessSchema } from '~~/shared/utils/adminSchemas'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const validated = validateBody(event, createAdminAccessSchema, body)

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
        message: getAdminApiErrorMessage(event, 'accessEmailRegistered'),
      })
    }

    return { data: item }
  } catch (error) {
    throwAdminMutationError('admin.access.create', error, event)
  }
})
