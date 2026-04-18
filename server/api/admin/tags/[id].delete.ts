import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidatePressRelatedCaches } from '../../../utils/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/adminErrors'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    await db.delete(tags).where(eq(tags.id, id))

    await invalidatePressRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.tags.delete', error, event)
  }
})
