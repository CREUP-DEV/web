import { defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { assertTagMutable } from '../../../utils/admin/tagMutations'
import { idRouteParamSchema, validateRouteParams } from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)

    const existingTag = await db.query.tags.findFirst({
      where: eq(tags.id, id),
      columns: { slug: true },
    })
    if (existingTag) {
      assertTagMutable(existingTag.slug, event)
    }

    await db.delete(tags).where(eq(tags.id, id))

    await invalidatePressRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.tags.delete', error, event)
  }
})
