import { createError, type H3Event } from 'h3'
import { and, eq, ne } from 'drizzle-orm'
import { db } from '../../db'
import { tags } from '../../db/schema'
import { RESERVED_TAG_SLUG } from '~~/shared/constants/tags'
import { getAdminApiErrorMessage } from '../locale/adminApiErrorMessages'

/**
 * Guards the built-in `all` meta-tag against edits and deletions from the admin panel.
 * Pass the tag's CURRENT slug (the one stored in the DB), not the request payload, so the
 * tag stays protected even when a request tries to rename it away from `all`.
 */
export function assertTagMutable(currentSlug: string, event: H3Event) {
  if (currentSlug === RESERVED_TAG_SLUG) {
    throw createError({
      statusCode: 403,
      message: getAdminApiErrorMessage(event, 'tagReserved'),
    })
  }
}

export async function assertTagSlugAvailable(slug: string, excludeId?: string) {
  const existingTag = await db.query.tags.findFirst({
    where: excludeId ? and(eq(tags.slug, slug), ne(tags.id, excludeId)) : eq(tags.slug, slug),
    columns: {
      id: true,
    },
  })

  if (!existingTag) {
    return
  }

  throw createError({
    statusCode: 409,
    message: 'SLUG_EXISTS',
  })
}
