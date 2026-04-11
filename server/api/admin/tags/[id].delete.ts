import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidatePressRelatedCaches } from '../../../utils/adminCacheInvalidation'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  const { id } = validateRouteParams(event, idRouteParamSchema)

  await db.delete(tags).where(eq(tags.id, id))

  await invalidatePressRelatedCaches()
  return { success: true }
})
