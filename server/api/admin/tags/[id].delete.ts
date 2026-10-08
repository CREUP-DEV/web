import { createError, defineEventHandler } from 'h3'
import { eq } from 'drizzle-orm'
import { db } from '../../../db'
import { tags } from '../../../db/schema'
import { invalidatePressRelatedCaches } from '../../../utils/admin/adminCacheInvalidation'
import { throwAdminMutationError } from '../../../utils/admin/adminErrors'
import { assertOptimisticLock } from '../../../utils/admin/optimisticLock'
import { assertTagMutable } from '../../../utils/admin/tagMutations'
import { getAdminApiErrorMessage } from '../../../utils/locale/adminApiErrorMessages'
import {
  idRouteParamSchema,
  optimisticDeleteQuerySchema,
  validateQuery,
  validateRouteParams,
} from '../../../utils/validation'

export default defineEventHandler(async (event) => {
  try {
    const { id } = validateRouteParams(event, idRouteParamSchema)
    const { updatedAt } = validateQuery(event, optimisticDeleteQuerySchema)

    // The reserved-slug guard and the version check read the row under a lock, so a concurrent
    // rename to/from the reserved slug or an edit cannot slip in before the delete.
    await db.transaction(async (tx) => {
      const [existingTag] = await tx
        .select({ slug: tags.slug, updatedAt: tags.updatedAt })
        .from(tags)
        .where(eq(tags.id, id))
        .for('update')

      if (!existingTag) {
        throw createError({
          statusCode: 404,
          message: getAdminApiErrorMessage(event, 'tagNotFound'),
        })
      }

      assertTagMutable(existingTag.slug, event)
      assertOptimisticLock(
        updatedAt,
        existingTag.updatedAt,
        getAdminApiErrorMessage(event, 'tagOptimisticLock')
      )

      await tx.delete(tags).where(eq(tags.id, id))
    })

    await invalidatePressRelatedCaches()
    return { data: { success: true } }
  } catch (error) {
    throwAdminMutationError('admin.tags.delete', error, event)
  }
})
